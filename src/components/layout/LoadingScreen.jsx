import { motion } from 'framer-motion'
import { EASE_OUT_EXPO } from '../../constants/colors.js'

export default function LoadingScreen({ progress = 0 }) {
  return (
    <motion.div
      className="absolute inset-0 z-[9999] flex flex-col items-center justify-center bg-bg"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.6, ease: EASE_OUT_EXPO } }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
        className="flex flex-col items-center gap-6 w-72"
      >
        {/* Logo mark */}
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-surface-3 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path
                d="M16 3L29 10v12L16 29 3 22V10L16 3z"
                stroke="#e63946"
                strokeWidth="1.5"
                fill="none"
              />
              <circle cx="16" cy="16" r="4" fill="#e63946" />
              <path d="M16 8v4M16 20v4M8 16h4M20 16h4" stroke="#e63946" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          {/* Pulse ring */}
          <motion.div
            className="absolute inset-0 rounded-2xl border border-accent/30"
            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
          />
        </div>

        <div className="text-center space-y-1">
          <h1 className="text-foreground font-display font-bold text-xl tracking-tight">
            CoberturaECMX
          </h1>
          <p className="text-muted text-sm">Cargando datos de emergencias CDMX</p>
        </div>

        {/* Progress bar */}
        <div className="w-full">
          <div className="flex justify-between text-xs text-muted mb-2">
            <span>Cargando datos</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1 bg-surface-3 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-accent rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
        </div>

        <p className="text-muted/60 text-xs text-center">
          Fuentes: C5 CDMX · INEGI · CLUES · Bomberos
        </p>
      </motion.div>
    </motion.div>
  )
}
