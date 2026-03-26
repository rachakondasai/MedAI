import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Optional key to force re-animation (use pathname) */
  id?: string
}

const variants = {
  initial:  { opacity: 0, y: 14, scale: 0.99, filter: 'blur(4px)' },
  animate:  { opacity: 1, y: 0,  scale: 1,    filter: 'blur(0px)' },
  exit:     { opacity: 0, y: -8, scale: 1.01, filter: 'blur(2px)' },
}

export default function PageTransition({ children, id }: Props) {
  return (
    <motion.div
      key={id}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{
        duration: 0.38,
        ease: [0.22, 1, 0.36, 1],
      }}
      style={{ willChange: 'transform, opacity, filter' }}
    >
      {children}
    </motion.div>
  )
}
