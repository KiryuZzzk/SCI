import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppContext } from '../../../context/AppContext.jsx'
import { nextOpId } from '../../../utils/idGen.js'
import { downloadAAR } from '../../../utils/icsForms/aar.js'
import {
  Plus, Film, Download, FileText, BookOpen, RotateCcw,
  Radio, Play, Pause, Search, CornerDownLeft, ClipboardList, LayoutDashboard, Presentation, Clock,
} from 'lucide-react'

/**
 * Command palette estilo Linear/Notion. Cmd/Ctrl+K.
 * Hand-rolled, sin dependencias. Filtra acciones por texto, navega con flechas.
 */
export default function SciCommandPalette({ open, onClose, onOpenAutoModal, onOpenExport, onOpenForms, onOpenDashboard, onStartPresentation, onOpenTimeline }) {
  const { state, dispatch } = useAppContext()
  const { sci } = state
  const [query, setQuery] = useState('')
  const [sel, setSel] = useState(0)
  const inputRef = useRef(null)

  const activeOp = sci.operationalPeriods?.find(op => op.id === sci.activeOpId)

  // Catálogo de acciones
  const actions = useMemo(() => {
    const run = (fn) => () => { fn(); onClose() }
    const list = [
      {
        id: 'new-incident', label: 'Crear incidente', hint: 'Nuevo incidente manual',
        Icon: Plus, kw: 'incidente nuevo crear agregar',
        disabled: sci.mode === 'auto',
        action: run(() => dispatch({ type: 'SCI_START_CREATION' })),
      },
      {
        id: 'load-scenario', label: 'Cargar escenario de simulación', hint: 'Escenarios automáticos',
        Icon: Film, kw: 'escenario simulacion cargar auto sismo',
        action: run(() => { dispatch({ type: 'SCI_SET_MODE', payload: 'auto' }); onOpenAutoModal() }),
      },
      {
        id: 'dashboard', label: 'Abrir sala de monitoreo', hint: 'Dashboard KPI en vivo (tecla D)',
        Icon: LayoutDashboard, kw: 'dashboard monitoreo sala kpi tablero panel c5',
        action: run(() => onOpenDashboard?.()),
      },
      {
        id: 'presentation', label: 'Iniciar modo presentación', hint: 'Pitch guiado (tecla P)',
        Icon: Presentation, kw: 'presentacion pitch demo guion modo p',
        action: run(() => onStartPresentation?.()),
      },
      {
        id: 'timeline', label: 'Abrir línea de tiempo', hint: 'Debrief / replay (tecla T)',
        Icon: Clock, kw: 'linea tiempo timeline debrief replay cronologia historial',
        action: run(() => onOpenTimeline?.()),
      },
      {
        id: 'export-log', label: 'Exportar registro', hint: 'CSV · PDF · JSON · MD',
        Icon: Download, kw: 'exportar log registro csv pdf descargar',
        action: run(onOpenExport),
      },
      {
        id: 'ics-forms', label: 'Generar formatos ICS', hint: 'ICS-201/209/211/214',
        Icon: FileText, kw: 'ics formato pdf 201 209 211 214 forma',
        action: run(onOpenForms),
      },
      {
        id: 'aar', label: 'Generar AAR (post-operación)', hint: 'Informe analítico con KPIs',
        Icon: ClipboardList, kw: 'aar informe post operacion kpi reporte lecciones',
        action: run(() => downloadAAR({ sci, op: activeOp, scenario: sci.autoTimeline?.name ?? null })),
      },
      {
        id: 'open-op', label: activeOp ? `Cerrar ${activeOp.label}` : 'Abrir período operacional', hint: 'OP',
        Icon: BookOpen, kw: 'op periodo operacional abrir cerrar',
        action: run(() => activeOp
          ? dispatch({ type: 'SCI_CLOSE_OP', payload: { id: activeOp.id } })
          : dispatch({ type: 'SCI_OPEN_OP', payload: { nextOpId: nextOpId() } })),
      },
      {
        id: 'mode-live', label: 'Cambiar a modo En vivo', hint: 'Operación manual',
        Icon: Radio, kw: 'modo vivo live manual',
        disabled: sci.mode === 'live',
        action: run(() => dispatch({ type: 'SCI_SET_MODE', payload: 'live' })),
      },
      {
        id: 'mode-auto', label: 'Cambiar a modo Simular', hint: 'Escenarios automáticos',
        Icon: Film, kw: 'modo simular auto',
        disabled: sci.mode === 'auto',
        action: run(() => dispatch({ type: 'SCI_SET_MODE', payload: 'auto' })),
      },
      {
        id: 'toggle-run', label: sci.running ? 'Pausar simulación' : 'Reanudar simulación', hint: 'Play / Pause',
        Icon: sci.running ? Pause : Play, kw: 'pausar reanudar play pause correr',
        action: run(() => dispatch({ type: 'SCI_SET_RUNNING', payload: !sci.running })),
      },
      {
        id: 'reset', label: 'Reiniciar escenario', hint: 'Limpia todo',
        Icon: RotateCcw, kw: 'reiniciar reset limpiar borrar',
        danger: true,
        action: run(() => dispatch({ type: 'SCI_RESET' })),
      },
    ]
    return list.filter(a => !a.disabled)
  }, [sci, sci.mode, sci.running, activeOp, dispatch, onClose, onOpenAutoModal, onOpenExport, onOpenForms, onOpenDashboard, onStartPresentation, onOpenTimeline])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return actions
    return actions.filter(a =>
      a.label.toLowerCase().includes(q) || a.kw.includes(q)
    )
  }, [query, actions])

  // Reset al abrir
  useEffect(() => {
    if (open) {
      setQuery('')
      setSel(0)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  useEffect(() => { setSel(0) }, [query])

  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(s + 1, filtered.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel(s => Math.max(s - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); filtered[sel]?.action() }
    else if (e.key === 'Escape') { e.preventDefault(); onClose() }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1300] flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            className="w-[480px] max-w-[90vw] bg-[#0c1520] border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Input */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-700/50">
              <Search size={15} className="text-slate-500 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={onKey}
                placeholder="Buscar acción…"
                className="flex-1 bg-transparent text-[13px] text-slate-100 placeholder:text-slate-600 focus:outline-none"
              />
              <kbd className="shrink-0 text-[9px] font-mono text-slate-600 bg-slate-800/60 border border-slate-700/50 rounded px-1.5 py-0.5">ESC</kbd>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto py-1.5">
              {filtered.length === 0 ? (
                <div className="px-4 py-6 text-center text-[11px] text-slate-600">Sin resultados</div>
              ) : (
                filtered.map((a, i) => {
                  const active = i === sel
                  return (
                    <button
                      key={a.id}
                      onMouseEnter={() => setSel(i)}
                      onClick={a.action}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        active ? 'bg-slate-800/80' : ''
                      }`}
                    >
                      <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${
                        a.danger ? 'bg-red-900/30 text-red-400' : 'bg-slate-800/80 text-slate-400'
                      }`}>
                        <a.Icon size={14} strokeWidth={2} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className={`text-[12px] font-medium ${a.danger ? 'text-red-300' : 'text-slate-200'}`}>{a.label}</div>
                        <div className="text-[9.5px] text-slate-500">{a.hint}</div>
                      </div>
                      {active && (
                        <CornerDownLeft size={13} className="text-slate-500 shrink-0" />
                      )}
                    </button>
                  )
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-slate-700/40 flex items-center gap-3 text-[9px] text-slate-600">
              <span className="flex items-center gap-1"><kbd className="font-mono bg-slate-800/60 rounded px-1">↑↓</kbd> navegar</span>
              <span className="flex items-center gap-1"><kbd className="font-mono bg-slate-800/60 rounded px-1">↵</kbd> ejecutar</span>
              <span className="ml-auto font-mono">⌘K</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
