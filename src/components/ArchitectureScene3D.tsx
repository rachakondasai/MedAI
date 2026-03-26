/**
 * ArchitectureScene3D.tsx
 *
 * A React Three Fiber + Framer Motion 3D component that renders three
 * glassmorphism vertical planes (Frontend / Backend / AI) with:
 *   • Neural Pulse  — glowing sphere travels top-to-bottom on demand
 *   • Hover-to-Explode — layers fan out on Y-axis on mouse-enter
 *   • Particle field  — ambient floating particles in the background
 *   • Per-layer particle emitters
 *   • Edge glow + soft bloom post-processing
 *
 * Color palette
 *   Frontend : #60A5FA  (blue)
 *   Backend  : #10B981  (emerald)
 *   AI       : #F59E0B  (amber)
 *
 * Spring physics: stiffness 120 / damping 20
 */

import { useRef, useState, useCallback, useEffect, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  RoundedBox,
  Text,
  Float,
  Sparkles,
  Trail,
  Sphere,
  Environment,
  MeshTransmissionMaterial,
} from '@react-three/drei'
import { MotionConfig } from 'framer-motion'
import { motion as motion2d } from 'framer-motion'
import * as THREE from 'three'
import { Play, Zap, RotateCcw } from 'lucide-react'

/* ─────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────── */
const LAYER_CONFIGS = [
  {
    id: 'frontend',
    label: 'Frontend',
    sublabel: 'React + Vite',
    color: '#60A5FA',
    emissive: '#1d4ed8',
    xPos: -3.4,
    icon: '⚛',
    description: 'React 18 · TypeScript · Tailwind · Framer Motion',
  },
  {
    id: 'backend',
    label: 'Backend',
    sublabel: 'FastAPI + Python',
    color: '#10B981',
    emissive: '#065f46',
    xPos: 0,
    icon: '⚙',
    description: 'FastAPI · LangChain · LangGraph · PostgreSQL',
  },
  {
    id: 'ai',
    label: 'AI Engine',
    sublabel: 'RAG + LLM',
    color: '#F59E0B',
    emissive: '#92400e',
    xPos: 3.4,
    icon: '🤖',
    description: 'Groq · Mistral · FAISS · Sentence Transformers',
  },
] as const

type LayerId = 'frontend' | 'backend' | 'ai'

const SPRING = { stiffness: 120, damping: 20, mass: 1 }

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  return [r, g, b]
}

/* ─────────────────────────────────────────────────────────
   PARTICLE FIELD (background ambient)
───────────────────────────────────────────────────────── */
function AmbientParticles() {
  const ref = useRef<THREE.Points>(null)
  const count = 200

  const { positions, speeds } = useRef((() => {
    const positions = new Float32Array(count * 3)
    const speeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 18
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8
      speeds[i] = 0.002 + Math.random() * 0.004
    }
    return { positions, speeds }
  })()).current

  useFrame(() => {
    if (!ref.current) return
    const pos = ref.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += speeds[i]
      if (pos[i * 3 + 1] > 6) pos[i * 3 + 1] = -6
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.035} color="#94a3b8" transparent opacity={0.4} sizeAttenuation />
    </points>
  )
}

/* ─────────────────────────────────────────────────────────
   NEURAL PULSE SPHERE
   Travels from top (y=3) → bottom (y=-3) along a given X
───────────────────────────────────────────────────────── */
interface NeuralPulseProps {
  active: boolean
  onComplete: () => void
  xPos: number
  color: string
}

function NeuralPulse({ active, onComplete, xPos, color }: NeuralPulseProps) {
  const ref = useRef<THREE.Mesh>(null)
  const trailRef = useRef<THREE.Mesh>(null)
  const progress = useRef(0)
  const wasActive = useRef(false)

  const [r, g, b] = hexToRgb(color)
  const threeColor = new THREE.Color(r, g, b)

  useFrame((_, delta) => {
    if (!ref.current) return

    if (active) {
      wasActive.current = true
      progress.current = Math.min(1, progress.current + delta * 0.7)
      const y = lerp(3.2, -3.2, progress.current)
      ref.current.position.set(xPos, y, 0.22)
      ref.current.visible = true

      // Pulsing scale
      const scale = 1 + 0.3 * Math.sin(progress.current * Math.PI * 8)
      ref.current.scale.setScalar(scale)

      if (progress.current >= 1) {
        onComplete()
        progress.current = 0
        ref.current.visible = false
      }
    } else {
      if (wasActive.current) {
        progress.current = 0
        wasActive.current = false
        ref.current.visible = false
      }
    }
  })

  return (
    <mesh ref={ref} visible={false} position={[xPos, 3.2, 0.22]}>
      <sphereGeometry args={[0.18, 24, 24]} />
      <meshStandardMaterial
        color={threeColor}
        emissive={threeColor}
        emissiveIntensity={3}
        transparent
        opacity={0.95}
        toneMapped={false}
      />
    </mesh>
  )
}

/* ─────────────────────────────────────────────────────────
   CONNECTION BEAM (animated line between layers)
───────────────────────────────────────────────────────── */
interface BeamProps {
  fromX: number
  toX: number
  fromColor: string
  toColor: string
  active: boolean
  delay?: number
}

function ConnectionBeam({ fromX, toX, fromColor, toColor, active, delay = 0 }: BeamProps) {
  const ref = useRef<THREE.Mesh>(null)
  const progress = useRef(0)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    if (active) {
      const timer = setTimeout(() => setStarted(true), delay * 1000)
      return () => clearTimeout(timer)
    } else {
      setStarted(false)
      progress.current = 0
    }
  }, [active, delay])

  useFrame((_, delta) => {
    if (!ref.current) return
    if (started) {
      progress.current = Math.min(1, progress.current + delta * 1.5)
      ref.current.scale.x = progress.current
      ref.current.visible = true
    } else {
      ref.current.visible = false
      progress.current = 0
    }
  })

  const midX = (fromX + toX) / 2
  const length = Math.abs(toX - fromX)

  return (
    <mesh ref={ref} position={[midX, 0, 0.1]} scale={[0, 1, 1]} visible={false}>
      <boxGeometry args={[length, 0.015, 0.015]} />
      <meshStandardMaterial
        color={fromColor}
        emissive={fromColor}
        emissiveIntensity={2}
        transparent
        opacity={0.7}
        toneMapped={false}
      />
    </mesh>
  )
}

/* ─────────────────────────────────────────────────────────
   DATA NODE (floating icon nodes above each plane)
───────────────────────────────────────────────────────── */
interface DataNodeProps {
  position: [number, number, number]
  color: string
  size?: number
  speed?: number
}

function DataNode({ position, color, size = 0.07, speed = 1 }: DataNodeProps) {
  const ref = useRef<THREE.Mesh>(null)
  const offset = useRef(Math.random() * Math.PI * 2)

  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.position.y = position[1] + Math.sin(clock.getElapsedTime() * speed + offset.current) * 0.15
    ref.current.rotation.x += 0.01
    ref.current.rotation.y += 0.015
  })

  const [r, g, b] = hexToRgb(color)
  const threeColor = new THREE.Color(r, g, b)

  return (
    <mesh ref={ref} position={position}>
      <octahedronGeometry args={[size, 0]} />
      <meshStandardMaterial
        color={threeColor}
        emissive={threeColor}
        emissiveIntensity={1.5}
        transparent
        opacity={0.8}
        toneMapped={false}
      />
    </mesh>
  )
}

/* ─────────────────────────────────────────────────────────
   GLASS LAYER PLANE
───────────────────────────────────────────────────────── */
interface GlassLayerProps {
  config: typeof LAYER_CONFIGS[number]
  isHovered: boolean
  isExploded: boolean
  pulseActive: boolean
  onPulseComplete: () => void
  onHover: (id: LayerId | null) => void
  explodeOffset: number
}

function GlassLayer({
  config,
  isHovered,
  isExploded,
  pulseActive,
  onPulseComplete,
  onHover,
  explodeOffset,
}: GlassLayerProps) {
  const groupRef = useRef<THREE.Group>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const innerRef = useRef<THREE.Mesh>(null)

  const targetY = useRef(0)
  const currentY = useRef(0)
  const targetScale = useRef(1)
  const currentScale = useRef(1)
  const targetGlow = useRef(0.15)
  const currentGlow = useRef(0.15)

  const [r, g, b] = hexToRgb(config.color)
  const layerColor = new THREE.Color(r, g, b)

  useFrame((_, delta) => {
    if (!groupRef.current || !glowRef.current || !innerRef.current) return

    const t = 1 - Math.pow(1 - Math.min(delta * 8, 1), 3)

    // Explode offset on Y
    targetY.current = isExploded ? explodeOffset : 0
    currentY.current = lerp(currentY.current, targetY.current, t)
    groupRef.current.position.y = currentY.current

    // Scale up slightly when hovered
    targetScale.current = isHovered ? 1.04 : 1
    currentScale.current = lerp(currentScale.current, targetScale.current, t)
    groupRef.current.scale.setScalar(currentScale.current)

    // Glow intensity
    targetGlow.current = isHovered ? 0.45 : pulseActive ? 0.35 : 0.15
    currentGlow.current = lerp(currentGlow.current, targetGlow.current, t * 0.6);
    (glowRef.current.material as THREE.MeshStandardMaterial).opacity = currentGlow.current

    // Subtle rotation on hover
    groupRef.current.rotation.y = lerp(
      groupRef.current.rotation.y,
      isHovered ? 0.07 : 0,
      t * 0.5
    )
  })

  return (
    <group ref={groupRef} position={[config.xPos, 0, 0]}>
      {/* Outer glow plane (billboard, slightly bigger) */}
      <mesh ref={glowRef} position={[0, 0, -0.08]}>
        <planeGeometry args={[2.6, 7.8]} />
        <meshStandardMaterial
          color={layerColor}
          emissive={layerColor}
          emissiveIntensity={0.8}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>

      {/* Main glass pane */}
      <RoundedBox
        args={[2.2, 7, 0.12]}
        radius={0.12}
        smoothness={4}
        onPointerEnter={() => onHover(config.id as LayerId)}
        onPointerLeave={() => onHover(null)}
        castShadow
      >
        <meshPhysicalMaterial
          color={new THREE.Color(r * 0.3 + 0.1, g * 0.3 + 0.1, b * 0.3 + 0.1)}
          emissive={new THREE.Color(r * 0.15, g * 0.15, b * 0.15)}
          emissiveIntensity={isHovered ? 0.8 : 0.3}
          transparent
          opacity={0.18}
          roughness={0.05}
          metalness={0.1}
          transmission={0.82}
          thickness={0.5}
          ior={1.4}
          reflectivity={0.3}
          side={THREE.FrontSide}
          toneMapped={false}
        />
      </RoundedBox>

      {/* Inner highlight (thin strip on edge) */}
      <mesh ref={innerRef} position={[0, 0, 0.07]}>
        <planeGeometry args={[2.1, 6.9]} />
        <meshStandardMaterial
          color={layerColor}
          transparent
          opacity={isHovered ? 0.1 : 0.04}
          side={THREE.FrontSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Top edge accent bar */}
      <mesh position={[0, 3.55, 0.07]}>
        <boxGeometry args={[2.1, 0.045, 0.02]} />
        <meshStandardMaterial
          color={layerColor}
          emissive={layerColor}
          emissiveIntensity={isHovered ? 4 : 2}
          toneMapped={false}
        />
      </mesh>

      {/* Bottom edge accent bar */}
      <mesh position={[0, -3.55, 0.07]}>
        <boxGeometry args={[2.1, 0.045, 0.02]} />
        <meshStandardMaterial
          color={layerColor}
          emissive={layerColor}
          emissiveIntensity={isHovered ? 4 : 2}
          toneMapped={false}
        />
      </mesh>

      {/* Layer title text */}
      <Text
        position={[0, 3.1, 0.12]}
        fontSize={0.32}
        color={config.color}
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
        outlineWidth={0.008}
        outlineColor="#000000"
        renderOrder={10}
      >
        {config.label}
      </Text>

      {/* Sublabel */}
      <Text
        position={[0, 2.72, 0.12]}
        fontSize={0.16}
        color="#94a3b8"
        anchorX="center"
        anchorY="middle"
        renderOrder={10}
      >
        {config.sublabel}
      </Text>

      {/* Description text */}
      <Text
        position={[0, -3.1, 0.12]}
        fontSize={0.12}
        color="#64748b"
        anchorX="center"
        anchorY="middle"
        maxWidth={2}
        textAlign="center"
        renderOrder={10}
      >
        {config.description}
      </Text>

      {/* Per-layer sparkles */}
      <Sparkles
        count={24}
        scale={[2, 6.5, 0.5]}
        size={isHovered ? 2 : 1.2}
        speed={isHovered ? 0.6 : 0.3}
        color={config.color}
        opacity={isHovered ? 0.7 : 0.35}
        position={[0, 0, 0.3]}
      />

      {/* Floating data nodes */}
      <DataNode position={[-0.6, 1.4, 0.25]} color={config.color} size={0.065} speed={1.2} />
      <DataNode position={[0.6, 0.6, 0.25]} color={config.color} size={0.05} speed={0.8} />
      <DataNode position={[-0.4, -0.4, 0.25]} color={config.color} size={0.075} speed={1.5} />
      <DataNode position={[0.5, -1.4, 0.25]} color={config.color} size={0.055} speed={0.9} />
      <DataNode position={[0, 0.0, 0.25]} color={config.color} size={0.04} speed={2} />

      {/* Neural pulse for this layer */}
      <NeuralPulse
        active={pulseActive}
        onComplete={onPulseComplete}
        xPos={0}
        color={config.color}
      />

      {/* Point light that follows layer color */}
      <pointLight
        position={[0, 0, 1.5]}
        color={config.color}
        intensity={isHovered ? 2.5 : 0.8}
        distance={5}
        decay={2}
      />
    </group>
  )
}

/* ─────────────────────────────────────────────────────────
   FLOOR GRID
───────────────────────────────────────────────────────── */
function FloorGrid() {
  const ref = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return;
    (ref.current.material as THREE.MeshStandardMaterial).opacity =
      0.12 + 0.04 * Math.sin(clock.getElapsedTime() * 0.5)
  })

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.9, 0]}>
      <planeGeometry args={[20, 20, 20, 20]} />
      <meshStandardMaterial
        color="#3b82f6"
        wireframe
        transparent
        opacity={0.12}
        toneMapped={false}
      />
    </mesh>
  )
}

/* ─────────────────────────────────────────────────────────
   ORBIT RING (decorative ring around the scene)
───────────────────────────────────────────────────────── */
function OrbitRing({ radius, speed, color }: { radius: number; speed: number; color: string }) {
  const ref = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.rotation.y = clock.getElapsedTime() * speed
    ref.current.rotation.z = clock.getElapsedTime() * speed * 0.3
  })

  return (
    <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, 0.012, 4, 80]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={1.5}
        transparent
        opacity={0.25}
        toneMapped={false}
      />
    </mesh>
  )
}

/* ─────────────────────────────────────────────────────────
   CAMERA CONTROLLER (subtle auto-rotate + mouse parallax)
───────────────────────────────────────────────────────── */
function CameraController({ exploded }: { exploded: boolean }) {
  const { camera } = useThree()
  const mousePos = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mousePos.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      }
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  useFrame(({ clock }, delta) => {
    const t = Math.min(delta * 3, 1)
    const targetZ = exploded ? 14 : 11
    const targetY = exploded ? 1.5 : 0

    camera.position.z = lerp(camera.position.z, targetZ, t * 0.3)
    camera.position.y = lerp(camera.position.y, targetY + mousePos.current.y * 0.4, t * 0.4)
    camera.position.x = lerp(camera.position.x, mousePos.current.x * 0.6, t * 0.4)

    camera.lookAt(0, exploded ? 0.5 : 0, 0)
  })

  return null
}

/* ─────────────────────────────────────────────────────────
   MAIN SCENE (inner R3F content)
───────────────────────────────────────────────────────── */
interface SceneProps {
  exploded: boolean
  activePulse: LayerId | null
  onPulseComplete: (id: LayerId) => void
  onLayerHover: (id: LayerId | null) => void
  hoveredLayer: LayerId | null
  beamsActive: boolean
}

function Scene({
  exploded,
  activePulse,
  onPulseComplete,
  onLayerHover,
  hoveredLayer,
  beamsActive,
}: SceneProps) {
  const EXPLODE_OFFSETS = [-1.2, 0, 1.2]

  return (
    <>
      <color attach="background" args={['#060b1a']} />
      <fog attach="fog" args={['#060b1a', 18, 35]} />

      {/* Ambient + directional lighting */}
      <ambientLight intensity={0.15} color="#c7d2fe" />
      <directionalLight position={[5, 8, 5]} intensity={0.4} color="#e0e7ff" castShadow />
      <directionalLight position={[-5, -4, -3]} intensity={0.2} color="#93c5fd" />

      {/* Environment for reflections */}
      <Environment preset="city" background={false} />

      {/* Camera controller */}
      <CameraController exploded={exploded} />

      {/* Background particles */}
      <AmbientParticles />

      {/* Floor grid */}
      <FloorGrid />

      {/* Decorative orbit rings */}
      <OrbitRing radius={7.5} speed={0.04} color="#3b82f6" />
      <OrbitRing radius={8.2} speed={-0.028} color="#8b5cf6" />

      {/* Central point light */}
      <pointLight position={[0, 0, 3]} color="#ffffff" intensity={0.3} distance={12} decay={2} />

      {/* Connection beams between layers */}
      <ConnectionBeam
        fromX={-3.4} toX={0}
        fromColor="#60A5FA" toColor="#10B981"
        active={beamsActive} delay={0.2}
      />
      <ConnectionBeam
        fromX={0} toX={3.4}
        fromColor="#10B981" toColor="#F59E0B"
        active={beamsActive} delay={0.6}
      />

      {/* Glass layer planes */}
      {LAYER_CONFIGS.map((cfg, i) => (
        <GlassLayer
          key={cfg.id}
          config={cfg}
          isHovered={hoveredLayer === cfg.id}
          isExploded={exploded}
          pulseActive={activePulse === cfg.id}
          onPulseComplete={() => onPulseComplete(cfg.id as LayerId)}
          onHover={onLayerHover}
          explodeOffset={EXPLODE_OFFSETS[i]}
        />
      ))}
    </>
  )
}

/* ─────────────────────────────────────────────────────────
   HUD OVERLAY (2D, on top of canvas)
───────────────────────────────────────────────────────── */
interface HUDProps {
  hoveredLayer: LayerId | null
  exploded: boolean
  pulsing: boolean
  onToggleExplode: () => void
  onTriggerPulse: () => void
  onReset: () => void
}

function HUD({
  hoveredLayer,
  exploded,
  pulsing,
  onToggleExplode,
  onTriggerPulse,
  onReset,
}: HUDProps) {
  const cfg = hoveredLayer ? LAYER_CONFIGS.find(l => l.id === hoveredLayer) : null

  return (
    <div className="absolute inset-0 pointer-events-none select-none" style={{ zIndex: 10 }}>
      {/* Top-left legend */}
      <motion2d.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute top-5 left-5 flex flex-col gap-2"
      >
        {LAYER_CONFIGS.map(cfg => (
          <div key={cfg.id} className="flex items-center gap-2.5">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: cfg.color,
                boxShadow: `0 0 8px ${cfg.color}`,
              }}
            />
            <span className="text-xs font-semibold" style={{ color: cfg.color }}>
              {cfg.label}
            </span>
            <span className="text-[10px] text-slate-500">— {cfg.sublabel}</span>
          </div>
        ))}
      </motion2d.div>

      {/* Bottom-center controls */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 pointer-events-auto">
        <motion2d.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex items-center gap-3"
        >
          {/* Neural Pulse button */}
          <motion2d.button
            whileHover={{ scale: 1.06, y: -2 }}
            whileTap={{ scale: 0.94 }}
            onClick={onTriggerPulse}
            disabled={pulsing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-xl"
            style={{
              background: pulsing
                ? 'rgba(30,30,50,0.7)'
                : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: pulsing ? '#64748b' : '#ffffff',
              boxShadow: pulsing ? 'none' : '0 4px 20px rgba(99,102,241,0.4)',
              border: '1px solid rgba(255,255,255,0.12)',
              backdropFilter: 'blur(10px)',
              cursor: pulsing ? 'not-allowed' : 'pointer',
            }}
          >
            <Zap className="w-4 h-4" />
            Neural Pulse
          </motion2d.button>

          {/* Explode / Collapse */}
          <motion2d.button
            whileHover={{ scale: 1.06, y: -2 }}
            whileTap={{ scale: 0.94 }}
            onClick={onToggleExplode}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-xl"
            style={{
              background: exploded
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#ffffff',
              boxShadow: exploded
                ? '0 4px 20px rgba(16,185,129,0.4)'
                : '0 4px 20px rgba(245,158,11,0.4)',
              border: '1px solid rgba(255,255,255,0.12)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Play className="w-4 h-4" />
            {exploded ? 'Collapse Layers' : 'Explode View'}
          </motion2d.button>

          {/* Reset */}
          <motion2d.button
            whileHover={{ scale: 1.06, y: -2 }}
            whileTap={{ scale: 0.94 }}
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-xl"
            style={{
              background: 'rgba(15,23,42,0.8)',
              color: '#94a3b8',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <RotateCcw className="w-4 h-4" />
          </motion2d.button>
        </motion2d.div>
      </div>

      {/* Hover tooltip */}
      <motion2d.div
        key={hoveredLayer ?? 'none'}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: cfg ? 1 : 0, scale: cfg ? 1 : 0.9 }}
        className="absolute top-5 right-5"
        style={{ pointerEvents: 'none' }}
      >
        {cfg && (
          <div
            className="px-4 py-3 rounded-2xl text-sm"
            style={{
              background: 'rgba(5,10,30,0.85)',
              border: `1px solid ${cfg.color}44`,
              backdropFilter: 'blur(16px)',
              boxShadow: `0 0 30px ${cfg.color}22`,
            }}
          >
            <p className="font-bold mb-0.5" style={{ color: cfg.color }}>
              {cfg.icon} {cfg.label}
            </p>
            <p className="text-slate-400 text-xs">{cfg.description}</p>
          </div>
        )}
      </motion2d.div>

      {/* Corner badge */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2">
        <motion2d.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase"
          style={{
            background: 'rgba(99,102,241,0.15)',
            border: '1px solid rgba(99,102,241,0.25)',
            color: '#818cf8',
            backdropFilter: 'blur(12px)',
          }}
        >
          Live 3D Architecture
        </motion2d.div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   PULSE SEQUENCE  (fires pulses one layer at a time)
───────────────────────────────────────────────────────── */
const PULSE_ORDER: LayerId[] = ['frontend', 'backend', 'ai']

function usePulseSequence() {
  const [activePulse, setActivePulse] = useState<LayerId | null>(null)
  const [pulsing, setPulsing] = useState(false)
  const queueRef = useRef<LayerId[]>([])
  const beamsActive = useRef(false)
  const [beamsState, setBeamsState] = useState(false)

  const triggerPulse = useCallback(() => {
    if (pulsing) return
    setPulsing(true)
    setBeamsState(false)
    queueRef.current = [...PULSE_ORDER]
    const next = queueRef.current.shift()
    if (next) setActivePulse(next)
  }, [pulsing])

  const onPulseComplete = useCallback((id: LayerId) => {
    setActivePulse(null)
    // Small pause between layers
    setTimeout(() => {
      const next = queueRef.current.shift()
      if (next) {
        setActivePulse(next)
      } else {
        // All done — activate beams
        setBeamsState(true)
        setTimeout(() => {
          setPulsing(false)
          setBeamsState(false)
        }, 3000)
      }
    }, 250)
  }, [])

  return { activePulse, pulsing, beamsActive: beamsState, triggerPulse, onPulseComplete }
}

/* ─────────────────────────────────────────────────────────
   ROOT EXPORT: ArchitectureScene3D
───────────────────────────────────────────────────────── */
export default function ArchitectureScene3D() {
  const [exploded, setExploded] = useState(false)
  const [hoveredLayer, setHoveredLayer] = useState<LayerId | null>(null)
  const { activePulse, pulsing, beamsActive, triggerPulse, onPulseComplete } = usePulseSequence()

  const handleReset = useCallback(() => {
    setExploded(false)
    setHoveredLayer(null)
  }, [])

  const handleLayerHover = useCallback((id: LayerId | null) => {
    setHoveredLayer(id)
    // Auto-explode when any layer is hovered
    if (id) setExploded(true)
    else setExploded(false)
  }, [])

  return (
    <MotionConfig transition={{ type: 'spring', ...SPRING }}>
      <div
        className="relative w-full overflow-hidden rounded-3xl"
        style={{
          height: 520,
          background: '#060b1a',
          boxShadow: '0 25px 80px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.06)',
        }}
      >
        {/* R3F Canvas */}
        <Canvas
          shadows
          camera={{ position: [0, 0, 11], fov: 52 }}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          dpr={[1, 1.5]}
        >
          <Suspense fallback={null}>
            <Scene
              exploded={exploded}
              activePulse={activePulse}
              onPulseComplete={onPulseComplete}
              onLayerHover={handleLayerHover}
              hoveredLayer={hoveredLayer}
              beamsActive={beamsActive}
            />
          </Suspense>
        </Canvas>

        {/* 2D HUD overlay */}
        <HUD
          hoveredLayer={hoveredLayer}
          exploded={exploded}
          pulsing={pulsing}
          onToggleExplode={() => setExploded(e => !e)}
          onTriggerPulse={triggerPulse}
          onReset={handleReset}
        />
      </div>
    </MotionConfig>
  )
}
