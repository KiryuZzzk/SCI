import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppContext } from '../../../context/AppContext.jsx'
import { SCI_AUTO_SCENARIOS, AUTO_SCENARIO_KEYS } from '../../../constants/sciAutoScenarios.js'
import { Play, Pause, ChevronLeft, ChevronRight, X } from 'lucide-react'

/**
 * Modo presentación / pitch. Tecla P.
 * Barra inferior cinematográfica con guión narrativo que auto-avanza,
 * disparando acciones reales (cargar escenario, abrir dashboard) mientras
 * el mapa y la simulación corren visibles detrás.
 */
const AUTOPLAY_MS = 9000

export default function SciPresentation({ open, onClose, onOpenDashboard }) {
  const { dispatch } = useAppContext()
  const [i, setI] = useState(0)
  const [auto, setAuto] = useState(true)
  const firedRef = useRef(new Set())

  // Guión — cada paso puede disparar una acción una sola vez
  const stepsRef = useRef([
    {
      title: 'CoberturaECMX',
      text: 'Plataforma de gestión de emergencias para la Ciudad de México. Sistema de Comando de Incidentes conforme al estándar NIMS/ICS.',
    },
    {
      title: 'Escenario en vivo',
      text: 'Cargamos un escenario de sismo magnitud 7.5 con epicentro en Guerrero. El sistema comienza a desplegar la respuesta automáticamente.',
      action: () => {
        const key = AUTO_SCENARIO_KEYS[0]
        const s = SCI_AUTO_SCENARIOS[key]
        dispatch({ type: 'SCI_RESET' })
        dispatch({ type: 'SCI_SET_MODE', payload: 'auto' })
        dispatch({ type: 'SCI_LOAD_AUTO_SCENARIO', payload: { key: s.key, name: s.name, events: s.events } })
        dispatch({ type: 'SCI_SET_RUNNING', payload: true })
      },
    },
    {
      title: 'Despacho inteligente',
      text: 'Un motor de decisión evalúa capacidad, tiempo de llegada y nivel NIMS de cada unidad disponible, y sugiere el paquete de respuesta óptimo para cada incidente.',
    },
    {
      title: 'Protocolo ICS',
      text: 'Cada incidente sigue la secuencia oficial de comando: evaluación, mando, recursos, operaciones y cierre. El avance se detecta automáticamente.',
    },
    {
      title: 'Sala de monitoreo',
      text: 'Vista de comando en tiempo real: indicadores clave, incidentes activos, estado de recursos y eventos críticos consolidados.',
      action: () => onOpenDashboard?.(),
    },
    {
      title: 'Documentación oficial',
      text: 'Formatos ICS-201, 209, 211, 214 y el informe post-operación (AAR) se generan en PDF institucional con un solo clic.',
    },
    {
      title: 'Listo para operar',
      text: 'CoberturaECMX — coordinación de emergencias con rigor, trazabilidad y velocidad. Gracias.',
    },
  ])
  const steps = stepsRef.current
  const step = steps[i]
  const isLast = i === steps.length - 1

  // Dispara la acción del paso actual (una vez)
  useEffect(() => {
    if (!open) return
    const s = steps[i]
    if (s?.action && !firedRef.current.has(i)) {
      firedRef.current.add(i)
      s.action()
    }
  }, [i, open, steps])

  // Autoplay
  useEffect(() => {
    if (!open || !auto) return
    const id = setTimeout(() => {
      setI(prev => (prev < steps.length - 1 ? prev + 1 : prev))
    }, AUTOPLAY_MS)
    return () => clearTimeout(id)
  }, [i, open, auto, steps.length])

  // Reset al abrir/cerrar
  useEffect(() => {
    if (open) { setI(0); setAuto(true); firedRef.current = new Set() }
  }, [open])

  // Teclas: ← → para navegar, ESC para salir
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'ArrowRight') setI(p => Math.min(p + 1, steps.length - 1))
      else if (e.key === 'ArrowLeft') setI(p => Math.max(p - 1, 0))
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, steps.length, onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Viñeta cinematográfica (no bloquea interacción del mapa) */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1190] pointer-events-none"
            style={{ boxShadow: 'inset 0 -160px 120px -60px rgba(0,0,0,0.85), inset 0 80px 80px -60px rgba(0,0,0,0.6)' }}
          />

          {/* Barra narrativa inferior */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-0 left-0 right-0 z-[1200] px-8 pb-6 pt-4"
          >
            <div className="max-w-3xl mx-auto">
              {/* Progreso */}
              <div className="flex gap-1 mb-3">
                {steps.map((_, idx) => (
                  <div key={idx} className="flex-1 h-0.5 rounded-full overflow-hidden bg-white/15">
                    <div
                      className="h-full bg-red-500 transition-all"
                      style={{ width: idx < i ? '100%' : idx === i ? '100%' : '0%', opacity: idx <= i ? 1 : 0.3 }}
                    />
                  </div>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-red-400 mb-1">
                    {step.title}
                  </div>
                  <p className="text-[20px] leading-snug text-white font-display font-semibold drop-shadow-lg">
                    {step.text}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Controles */}
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={() => setAuto(a => !a)}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur flex items-center justify-center text-white transition-colors"
                  title={auto ? 'Pausar' : 'Reproducir'}
                >
                  {auto ? <Pause size={15} /> : <Play size={15} />}
                </button>
                <button
                  onClick={() => setI(p => Math.max(p - 1, 0))}
                  disabled={i === 0}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur flex items-center justify-center text-white transition-colors disabled:opacity-30"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => isLast ? onClose() : setI(p => p + 1)}
                  className="px-5 h-9 rounded-full bg-red-600 hover:bg-red-500 text-white text-[12px] font-bold flex items-center gap-1.5 transition-colors"
                >
                  {isLast ? 'Finalizar' : 'Siguiente'}
                  {!isLast && <ChevronRight size={15} />}
                </button>
                <span className="text-[11px] text-white/50 font-mono ml-1">{i + 1} / {steps.length}</span>
                <button
                  onClick={onClose}
                  className="ml-auto flex items-center gap-1.5 text-[11px] text-white/60 hover:text-white transition-colors"
                >
                  <X size={14} /> Salir (ESC)
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
