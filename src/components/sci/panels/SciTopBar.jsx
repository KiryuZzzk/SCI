import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAppContext } from '../../../context/AppContext.jsx'
import { ZONE_TYPE_KEYS, SCI_ZONE_TYPES } from '../../../constants/sciZoneTypes.js'
import SciUtcClock from './SciUtcClock.jsx'
import { Play, Pause, RotateCcw, Film, FileText, Download, ChevronDown, BookOpen, Plus, LayoutDashboard } from 'lucide-react'
import SciIcon from '../SciIcon.jsx'
import { nextOpId } from '../../../utils/idGen.js'

function useElapsed(startedAt) {
  const [sec, setSec] = useState(0)
  useEffect(() => {
    if (!startedAt) { setSec(0); return }
    const id = setInterval(() => setSec(Math.floor((Date.now() - startedAt) / 1000)), 1000)
    return () => clearInterval(id)
  }, [startedAt])
  return sec
}

function fmtTime(s) {
  const m = Math.floor(s / 60)
  const ss = String(s % 60).padStart(2, '0')
  return `${m}:${ss}`
}

export default function SciTopBar({ onOpenAutoModal, onOpenExport, onOpenForms, onOpenDashboard }) {
  const { state, dispatch } = useAppContext()
  const { mode, running, speed, creation, zoneCreator, autoTimeline, operationalPeriods, activeOpId } = state.sci
  const [zoneMenuOpen, setZoneMenuOpen] = useState(false)
  const [opMenuOpen, setOpMenuOpen]     = useState(false)
  const activeOp = operationalPeriods?.find(op => op.id === activeOpId) ?? null

  const isPicking = creation.step === 'pick-point' || zoneCreator?.awaitingPoint
  const isSimulating = mode === 'auto' && autoTimeline != null
  const elapsed = useElapsed(isSimulating ? autoTimeline.startedAt : null)

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute top-12 z-[900] bg-[#080f18]/96 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-xl"
      style={{ left: '272px', right: '16px' }}
    >
    <div className="flex items-center gap-1.5 px-2.5 py-1.5">
      {/* ── Reloj UTC ── */}
      <SciUtcClock />
      <div className="w-px h-5 bg-slate-700/60" />

      {/* ── OP chip ── */}
      <div className="relative">
        <button
          onClick={() => setOpMenuOpen(o => !o)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-mono font-semibold transition-colors ${
            activeOp
              ? 'bg-violet-900/50 border border-violet-700/60 text-violet-300 hover:bg-violet-800/50'
              : 'bg-slate-800/70 border border-slate-700/50 text-slate-500 hover:text-slate-300'
          }`}
          title="Período Operacional"
        >
          <BookOpen size={10} strokeWidth={2} />
          {activeOp ? activeOp.label : 'Sin OP'}
          <ChevronDown size={9} strokeWidth={2} />
        </button>
        {opMenuOpen && (
          <div className="absolute top-full left-0 mt-1 bg-[#080f18] border border-slate-700/50 rounded-lg shadow-xl z-[950] min-w-[180px] overflow-hidden">
            {activeOp ? (
              <button
                onClick={() => {
                  dispatch({ type: 'SCI_CLOSE_OP', payload: { id: activeOpId } })
                  setOpMenuOpen(false)
                }}
                className="w-full text-left px-3 py-2 text-[11px] hover:bg-slate-800 text-amber-400"
              >Cerrar {activeOp.label}</button>
            ) : null}
            <button
              onClick={() => {
                dispatch({ type: 'SCI_OPEN_OP', payload: { nextOpId: nextOpId() } })
                setOpMenuOpen(false)
              }}
              className="w-full text-left px-3 py-2 text-[11px] hover:bg-slate-800 text-emerald-400 flex items-center gap-1.5"
            ><Plus size={11} strokeWidth={2} />Abrir nuevo OP</button>
            {operationalPeriods?.length > 0 && (
              <div className="border-t border-slate-700/50 px-3 py-1.5">
                {operationalPeriods.slice(-3).reverse().map(op => (
                  <div key={op.id} className="flex items-center justify-between py-0.5">
                    <span className="text-[10px] font-mono text-slate-400">{op.label}</span>
                    <span className={`text-[9px] ${op.status === 'active' ? 'text-emerald-400' : 'text-slate-600'}`}>
                      {op.status === 'active' ? 'activo' : 'cerrado'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="w-px h-5 bg-slate-700/60" />

      {/* ── Modo ── */}
      <div className="flex items-center bg-slate-800/70 rounded-lg p-0.5">
        <button
          onClick={() => dispatch({ type: 'SCI_SET_MODE', payload: 'live' })}
          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
            mode === 'live' ? 'bg-slate-600 text-slate-100' : 'text-slate-500 hover:text-slate-300'
          }`}
        >En vivo</button>
        <button
          onClick={() => dispatch({ type: 'SCI_SET_MODE', payload: 'auto' })}
          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
            mode === 'auto' ? 'bg-slate-600 text-slate-100' : 'text-slate-500 hover:text-slate-300'
          }`}
        >Simular</button>
      </div>

      {/* ── Indicador de simulación activa ── */}
      {isSimulating && (
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-950/60 border border-red-800/50 rounded-lg">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-mono text-red-300 font-semibold">
            {fmtTime(elapsed)}
          </span>
          <span className="text-[10px] text-red-400 max-w-[140px] truncate">
            {autoTimeline.name}
          </span>
        </div>
      )}

      {/* ── Velocidad ── */}
      <div className="flex items-center bg-slate-800/70 rounded-lg p-0.5">
        {[1, 2, 3].map(s => (
          <button
            key={s}
            onClick={() => dispatch({ type: 'SCI_SET_SPEED', payload: s })}
            className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
              speed === s ? 'bg-slate-600 text-slate-100' : 'text-slate-500 hover:text-slate-300'
            }`}
          >×{s}</button>
        ))}
      </div>

      {/* ── Play/Pause ── */}
      <button
        onClick={() => dispatch({ type: 'SCI_SET_RUNNING', payload: !running })}
        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors flex items-center gap-1 ${
          running
            ? 'bg-slate-800/70 border-slate-700/50 text-slate-400 hover:text-slate-200'
            : 'bg-slate-700 border-slate-500 text-slate-200'
        }`}
      >{running ? <Pause size={11} strokeWidth={2} /> : <Play size={11} strokeWidth={2} />}</button>

      <div className="w-px h-5 bg-slate-700/60" />

      {/* ── + Incidente (solo En vivo) ── */}
      <button
        onClick={() => dispatch({ type: 'SCI_START_CREATION' })}
        disabled={isPicking || mode === 'auto'}
        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
          mode === 'auto' || isPicking
            ? 'text-slate-700 cursor-not-allowed'
            : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
        }`}
        title={mode === 'auto' ? 'Desactiva "Simular" para agregar incidentes manualmente' : ''}
      >+ Incidente</button>

      {/* ── + Zona SCI ── */}
      <div className="relative">
        <button
          onClick={() => setZoneMenuOpen(o => !o)}
          disabled={isPicking}
          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800/70 border border-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1"
        >+ Zona <ChevronDown size={10} strokeWidth={2} /></button>
        {zoneMenuOpen && (
          <div className="absolute top-full left-0 mt-1 bg-[#080f18] border border-slate-700/50 rounded-lg shadow-xl z-[950] min-w-[160px] overflow-hidden">
            {ZONE_TYPE_KEYS.map(k => {
              const z = SCI_ZONE_TYPES[k]
              return (
                <button
                  key={k}
                  onClick={() => {
                    dispatch({ type: 'SCI_START_ZONE_CREATION', payload: { type: k, label: '', incidentId: null } })
                    setZoneMenuOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 text-[11px] hover:bg-slate-800 flex items-center gap-2"
                >
                  <SciIcon type="zone" code={k} size={13} color={z.color} />
                  <span className="text-slate-300">{z.label}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Escenarios (solo en modo Simular) ── */}
      {mode === 'auto' && (
        <button
          onClick={onOpenAutoModal}
          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-700 border border-slate-600 text-slate-200 hover:bg-slate-600 transition-colors flex items-center gap-1.5"
        ><Film size={11} strokeWidth={1.75} />Escenarios</button>
      )}

      {/* ── Formatos ICS ── */}
      <button
        onClick={onOpenForms}
        title="Generar formatos ICS (ICS-201/209/211/214)"
        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800/70 border border-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5"
      ><FileText size={11} strokeWidth={1.75} />ICS</button>

      {/* ── Export ── */}
      <button
        onClick={onOpenExport}
        title="Exportar registro"
        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800/70 border border-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5"
      ><Download size={11} strokeWidth={1.75} />Log</button>

      {/* ── Dashboard sala de monitoreo ── */}
      <button
        onClick={onOpenDashboard}
        title="Sala de monitoreo (tecla D)"
        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800/70 border border-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5"
      ><LayoutDashboard size={11} strokeWidth={1.75} />Monitor</button>

      {/* ── Reset ── */}
      <button
        onClick={() => dispatch({ type: 'SCI_RESET' })}
        title="Reiniciar todo"
        className="px-2 py-1 rounded-lg text-[11px] bg-slate-800/70 border border-slate-700/50 text-slate-500 hover:text-red-400 transition-colors"
      ><RotateCcw size={11} strokeWidth={1.75} /></button>

      </div>
      {/* ── Picking hint — outside scroll div, anchored to bar ── */}
      {isPicking && (
        <span className="absolute -bottom-9 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-500 text-slate-200 text-[10px] font-semibold px-3 py-1.5 rounded-full whitespace-nowrap shadow-xl">
          Clic en el mapa para confirmar la ubicación
        </span>
      )}
    </motion.div>
  )
}
