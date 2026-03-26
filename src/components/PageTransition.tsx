import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Optional key to force re-animation (use pathname) */
  id?: string
}

const variants = {
  initial:  { opacity: 0, y: 10 },
  animate:  { opacity: 1, y: 0  },
  exit:     { opacity: 0, y: -6 },
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
        duration: 0.28,
        ease: [0.22, 1, 0.36, 1],
      }}
      style={{ willChange: 'opacity, transform' }}
      className="min-h-full"
    >
      {children}
    </motion.div>
  )
}
