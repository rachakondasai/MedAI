/**
 * Global location hook — detects the user's city automatically on app load
 * via the browser Geolocation API + OpenStreetMap Nominatim reverse geocoding.
 */

import { useState, useEffect } from 'react'

export interface GeoLocation {
  city: string
  latitude: number | null
  longitude: number | null
  loading: boolean
  error: string | null
}

const CACHE_KEY = 'medai_user_location'
const CACHE_EXPIRY_MS = 30 * 60 * 1000 // 30 minutes

function getCachedLocation(): { city: string; lat: number; lon: number } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Date.now() - parsed.timestamp < CACHE_EXPIRY_MS) {
      return { city: parsed.city, lat: parsed.lat, lon: parsed.lon }
    }
    localStorage.removeItem(CACHE_KEY)
  } catch {
    // ignore
  }
  return null
}

function cacheLocation(city: string, lat: number, lon: number) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ city, lat, lon, timestamp: Date.now() }))
}

export function useUserLocation(): GeoLocation {
  const [geo, setGeo] = useState<GeoLocation>({
    city: '',
    latitude: null,
    longitude: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    // Check cache first
    const cached = getCachedLocation()
    if (cached) {
      setGeo({ city: cached.city, latitude: cached.lat, longitude: cached.lon, loading: false, error: null })
      return
    }

    if (!navigator.geolocation) {
      setGeo((prev) => ({ ...prev, loading: false, error: 'Geolocation not supported' }))
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          )
          const data = await res.json()
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.state_district ||
            data.address?.state ||
            ''
          if (city) {
            cacheLocation(city, latitude, longitude)
          }
          setGeo({ city, latitude, longitude, loading: false, error: null })
        } catch {
          setGeo({ city: '', latitude, longitude, loading: false, error: 'Reverse geocoding failed' })
        }
      },
      (err) => {
        setGeo((prev) => ({ ...prev, loading: false, error: err.message || 'Location denied' }))
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    )
  }, [])

  return geo
}
