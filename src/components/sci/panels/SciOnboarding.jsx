import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Compass, Film, Sparkles, ClipboardCheck, FileText, LayoutDashboard,
  Command, Database, ChevronLeft, ChevronRight, X,
} from 'lucide-react'

const STEPS = [
  {
    Icon: Compass, color: '#38bdf8',
    title: 'Bienvenido al modo SCI',
    body: 'Sistema de Comando de Incidentes para gestión de emergencias en CDMX, basado en el estándar NIMS/ICS. Crea incidentes, despacha recursos y coordina la respuesta en tiempo real.',
  },
  {
    Icon: Film, color: '#a78bfa',
    title: 'Escenarios de simulación',
    body: 'Cambia a modo "Simular" y carga un escenario automatizado (sismo, inundación, etc.). El sistema despacha unidades y narra los eventos solo. Ideal para entrenamiento y demos.',
  },
  {
    Icon: Sparkles, color: '#a78bfa',
    title: 'Recomendación de despacho (IA)',
    body: 'Al abrir un incidente, el motor de decisión analiza capacidad, ETA y nivel NIMS de cada unidad disponible y sugiere el mejor "paquete de respuesta". Un clic despacha todo.',
  },
  {
    Icon: ClipboardCheck, color: '#22c55e',
    title: 'Checklist SCI',
    body: 'Cada incidente incluye la secuencia oficial de acciones ICS. El sistema detecta tu progreso automáticamente (mando asignado, OP abierto, unidades en escena) y marca los pasos.',
  },
  {
    Icon: FileText, color: '#fb923c',
    title: 'Formatos ICS oficiales',
    body: 'Genera PDFs institucionales ICS-201, 209, 211, 214 y el AAR (informe post-operación) con un clic. Listos para handoff formal o archivo.',
  },
  {
    Icon: LayoutDashboard, color: '#f59e0b',
    title: 'Sala de monitoreo',
    body: 'Presiona la tecla D para abrir el dashboard de monitoreo en vivo: KPIs, incidentes activos, estado de recursos y eventos críticos. Perfecto para sala de comando.',
  },
  {
    Icon: Database, color: '#38bdf8',
    title: 'Guarda y comparte escenarios',
    body: 'Tu trabajo se guarda solo. Usa el menú "Escenarios" (abajo a la izquierda) para guardar instantáneas nombradas, exportar a JSON o importar escenarios compartidos.',
  },
  {
    Icon: Command, color: '#94a3b8',
    title: 'Atajo rápido',
    body: 'Presiona ⌘K (o Ctrl+K) en cualquier momento para abrir la paleta de comandos y ejecutar cualquier acción al instante. Listo para comenzar.',
  },
]

export default function SciOnboarding({ open, onClose }) {
  const [i, setI] = useState(0)

  const step = STEPS[i]
  const isFirst = i === 0
  const isLast = i === STEPS.length - 1

  const next = () => { if (isLast) onClose(); else setI(i + 1) }
  const prev = () => { if (!isFirst) setI(i - 1) }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1500] flex items-center justify-center bg-black/75 backdrop-blur-sm p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            className="w-[440px] max-w-full bg-[#0c1520] border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Skip */}
            <div className="flex justify-end p-2">
              <button onClick={onClose} className="text-slate-600 hover:text-slate-300 transition-colors p-1">
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="px-8 pb-2 text-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: step.color + '1f' }}
                  >
                    <step.Icon size={30} style={{ color: step.color }} strokeWidth={1.75} />
                  </div>
                  <h2 className="text-[16px] font-bold text-slate-100 mb-2">{step.title}</h2>
                  <p className="text-[12px] text-slate-400 leading-relaxed min-h-[68px]">{step.body}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Dots */}
            <div className="flex items-center justify-center gap-1.5 py-3">
              {STEPS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setI(idx)}
                  className="rounded-full transition-all"
                  style={{
                    width: idx === i ? 18 : 6,
                    height: 6,
                    backgroundColor: idx === i ? step.color : '#334155',
                  }}
                />
              ))}
            </div>

            {/* Footer nav */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-700/40 bg-slate-900/30">
              <button
                onClick={prev}
                disabled={isFirst}
                className={`flex items-center gap-1 text-[11px] font-semibold transition-colors ${
                  isFirst ? 'text-slate-700 cursor-not-allowed' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ChevronLeft size={14} /> Atrás
              </button>
              <span className="text-[10px] text-slate-600 font-mono">{i + 1} / {STEPS.length}</span>
              <button
                onClick={next}
                className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-[11px] font-bold text-white transition-colors"
                style={{ backgroundColor: step.color }}
              >
                {isLast ? 'Comenzar' : 'Siguiente'}
                {!isLast && <ChevronRight size={14} />}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
