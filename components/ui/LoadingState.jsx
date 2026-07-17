'use client'

import { motion } from "framer-motion"

const dotTransition = (delay) => ({
  duration: 0.9,
  repeat: Infinity,
  ease: "easeInOut",
  delay,
})

// Full-height centered loading indicator for a page/panel's initial fetch.
// Use in place of a bare "Loading..." block: <LoadingState label="Loading students..." />
export default function LoadingState({ label = "Loading...", className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className={`flex flex-col items-center justify-center gap-3 h-full py-16 ${className}`}
    >
      <div className="flex items-center gap-2">
        {[0, 1, 2].map(i => (
          <motion.span
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-primary"
            animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
            transition={dotTransition(i * 0.15)}
          />
        ))}
      </div>
      {label && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="text-sm text-muted"
        >
          {label}
        </motion.p>
      )}
    </motion.div>
  )
}
