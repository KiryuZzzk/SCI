import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion' // eslint-disable-line no-unused-vars
import { useAppContext } from '../../../context/AppContext.jsx'
import { SCI_DEPENDENCIES, DEPENDENCY_KEYS } from '../../../constants/sciDependencies.js'
import { SCI_INCIDENT_TYPES } from '../../../constants/sciIncidentTypes.js'
import { fmtEta } from '../../../utils/etaModel.js'
import { NIMS_TYPE, NIMS_TYPE_COLOR } from '../../../constants/nimsResourceTyping.js'
import { STATUS_CODES } from '../../../constants/sciStatusCodes.js'
import SciCommandPanel from './SciCommandPanel.jsx'
import SciIcon from '../SciIcon.jsx'
import { Users, TriangleAlert, ClipboardList } from 'lucide-react'

// ── Helpers ──────────────────────────────────────────────────

const STATE_DOT = {
  disponible:      'bg-emerald-500',
  asignado:        'bg-amber-400',
  'no-disponible': 'bg-slate-600',
}

const LOG_LEVEL = {
  critical: { dot: 'bg-red-500',     text: 'text-red-300'     },
  dispatch: { dot: 'bg-amber-400',   text: 'text-amber-300'   },
  info:     { dot: 'bg-slate-600',   text: 'text-slate-400'   },
  arrival:  { dot: 'bg-emerald-500', text: 'text-emerald-300' },
}

const INCIDENT_RING = {
  sismo:       'border-purple-500/60',
  colapso:     'border-orange-500/60',
  incendio:    'border-red-500/60',
  explosion:   'border-red-600/60',
  hazmat:      'border-yellow-500/60',
  fugaQuimica: 'border-emerald-500/60',
  inundacion:  'border-sky-500/60',
  vial:        'border-amber-500/60',
  seguridad:   'border-blue-500/60',
}

const STATE_FILTER = [
  { key: 'all',           label: 'Todos'  },
  { key: 'disponible',    label: 'Libre'  },
  { key: 'asignado',      label: 'Activo' },
  { key: 'no-disponible', label: 'N/D'    },
]

const TAB_ICONS = {
  recursos:   Users,
  incidentes: TriangleAlert,
  registro:   ClipboardList,
}
const TABS = [
  { key: 'recursos',   label: 'Recursos'   },
  { key: 'incidentes', label: 'Incidentes' },
  { key: 'registro',   label: 'Registro'   },
]

// ── Resources tab ─────────────────────────────────────────────

function ResourcesTab() {
  const { state, dispatch } = useAppContext()
  const { byId, allIds } = state.sci.resources
  const f = state.sci.uiFilters
  const [depsOpen, setDepsOpen] = useState(false)

  const set = (patch) => dispatch({ type: 'SCI_SET_FILTERS', payload: patch })

  const grouped = useMemo(() => {
    const groups = {}
    DEPENDENCY_KEYS.forEach(k => { groups[k] = [] })
    allIds.forEach(id => {
      const r = byId[id]
      if (!r) return
      if (f.dependency !== 'all' && r.dependency !== f.dependency) return
      if (f.state !== 'all' && r.state !== f.state) return
      groups[r.dependency].push(r)
    })
    return groups
  }, [byId, allIds, f])

  const assignedCount = allIds.filter(id => byId[id]?.state === 'asignado').length
  const freeCount     = allIds.length - assignedCount

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Stats strip */}
      <div className="shrink-0 px-3 py-1.5 flex gap-3 text-[9px] border-b border-slate-800/60">
        <span className="text-slate-500">{allIds.length} total</span>
        <span className="text-amber-400 font-semibold">{assignedCount} activos</span>
        <span className="text-emerald-400">{freeCount} libres</span>
      </div>

      {/* State filter */}
      <div className="shrink-0 px-3 pt-2 pb-1.5 border-b border-slate-800/60 space-y-2">
        <div className="flex gap-1">
          {STATE_FILTER.map(s => (
            <button
              key={s.key}
              onClick={() => set({ state: s.key })}
              className={`px-2 py-0.5 rounded text-[9px] font-medium transition-colors ${
                f.state === s.key ? 'bg-slate-600 text-slate-100' : 'bg-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >{s.label}</button>
          ))}
        </div>

        {/* Dep filter */}
        <button
          onClick={() => setDepsOpen(o => !o)}
          className="w-full flex items-center justify-between text-[9px] text-slate-500 hover:text-slate-300 transition-colors"
        >
          <span>
            Dep: <span className="text-slate-300">
              {f.dependency === 'all' ? 'Todas' : SCI_DEPENDENCIES[f.dependency]?.label}
            </span>
          </span>
          <span>{depsOpen ? '▲' : '▼'}</span>
        </button>

        {depsOpen && (
          <div className="flex flex-wrap gap-1 pb-1">
            <button
              onClick={() => { set({ dependency: 'all' }); setDepsOpen(false) }}
              className={`px-2 py-0.5 rounded text-[9px] transition-colors ${
                f.dependency === 'all' ? 'bg-slate-600 text-slate-100' : 'bg-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >Todas</button>
            {DEPENDENCY_KEYS.map(k => {
              const dep = SCI_DEPENDENCIES[k]
              return (
                <button
                  key={k}
                  onClick={() => { set({ dependency: k }); setDepsOpen(false) }}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] transition-colors ${
                    f.dependency === k ? 'text-slate-900 font-semibold' : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                  style={f.dependency === k ? { backgroundColor: dep.color } : undefined}
                >
                  <SciIcon type="dep" code={k} size={10} color={f.dependency === k ? '#0f172a' : dep.color} />
                  {dep.label}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {DEPENDENCY_KEYS.map(k => {
          const items = grouped[k]
          if (!items || items.length === 0) return null
          const dep = SCI_DEPENDENCIES[k]
          return (
            <div key={k}>
              <div className="px-3 py-1 bg-slate-800/50 flex items-center gap-1.5 sticky top-0 z-10">
                <SciIcon type="dep" code={k} size={11} />
                <span className="text-[9px] font-semibold text-slate-400">{dep.label}</span>
                <span className="ml-auto text-[8px] text-slate-600 font-mono">{items.length}</span>
              </div>
              {items.map(r => {
                const selected = state.sci.selectedResourceId === r.id
                return (
                  <button
                    key={r.id}
                    onClick={() => dispatch({ type: 'SCI_SELECT_RESOURCE', payload: r.id })}
                    className={`w-full text-left px-3 py-1.5 flex items-center gap-2 border-b border-slate-800/30 transition-colors ${
                      selected ? 'bg-slate-700/60' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATE_DOT[r.state] ?? 'bg-slate-600'}`} />
                    <span className="text-[10px] text-slate-300 truncate flex-1">{r.label}</span>
                    {/* NIMS type badge */}
                    {NIMS_TYPE[r.typeCode] && (
                      <span
                        className="text-[7px] font-bold font-mono px-0.5 rounded shrink-0"
                        style={{ color: NIMS_TYPE_COLOR[NIMS_TYPE[r.typeCode]], border: `1px solid ${NIMS_TYPE_COLOR[NIMS_TYPE[r.typeCode]]}40` }}
                      >T-{NIMS_TYPE[r.typeCode]}</span>
                    )}
                    {r.assignedIncidentId && r.eta != null && r.eta > 0 && (
                      <span className="text-[8px] text-amber-400 font-mono shrink-0">{fmtEta(r.eta)}</span>
                    )}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Incidents tab ──────────────────────────────────────────────

function IncidentsTab() {
  const { state, dispatch } = useAppContext()
  const { incidents } = state.sci

  const active = incidents.filter(i => i.status === 'active')
  const closed = incidents.filter(i => i.status === 'closed')

  if (incidents.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-2">
        <TriangleAlert size={28} className="opacity-20 text-slate-400" />
        <p className="text-[10px] text-slate-500">Sin incidentes activos.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {active.length > 0 && (
        <>
          <div className="px-3 py-1.5 bg-slate-800/60 sticky top-0 z-10 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              Activos · {active.length}
            </span>
          </div>
          {active.map(inc => {
            const _t  = SCI_INCIDENT_TYPES[inc.type] ?? {}
            const ring = INCIDENT_RING[inc.type] ?? 'border-slate-600'
            const selected = state.sci.selectedIncidentId === inc.id
            const victimas = inc.fields?.victimas ?? inc.fields?.atrapados ?? null

            return (
              <button
                key={inc.id}
                onClick={() => dispatch({ type: 'SCI_SELECT_INCIDENT', payload: inc.id })}
                className={`w-full text-left px-3 py-2 border-b border-slate-800/40 flex items-start gap-2 transition-colors ${
                  selected ? 'bg-slate-700/60' : 'hover:bg-slate-800/40'
                }`}
              >
                {/* Icon ring */}
                <div className={`mt-0.5 w-7 h-7 rounded-full border ${ring} flex items-center justify-center shrink-0 bg-slate-900/60`}>
                  <SciIcon type="incident" code={inc.type} size={14} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono font-bold text-slate-100">{inc.clave}</span>
                    {inc.parentId != null && (
                      <span className="text-[8px] text-slate-600">↳ sec.</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {victimas != null && victimas > 0 && (
                      <span className="text-[9px] text-red-300 font-semibold">
                        {victimas} {inc.fields?.atrapados != null ? 'atrap.' : 'víct.'}
                      </span>
                    )}
                    <span className="text-[9px] text-slate-600">
                      {inc.assignedUnitIds.length} ud.
                    </span>
                  </div>
                </div>

                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shrink-0 mt-1" />
              </button>
            )
          })}
        </>
      )}

      {closed.length > 0 && (
        <>
          <div className="px-3 py-1.5 bg-slate-800/30 sticky top-0 z-10">
            <span className="text-[9px] font-semibold text-slate-600 uppercase tracking-wider">Cerrados · {closed.length}</span>
          </div>
          {closed.map(inc => {
            const _t = SCI_INCIDENT_TYPES[inc.type] ?? {}
            return (
              <button
                key={inc.id}
                onClick={() => dispatch({ type: 'SCI_SELECT_INCIDENT', payload: inc.id })}
                className="w-full text-left px-3 py-1.5 border-b border-slate-800/20 flex items-center gap-2 opacity-30 hover:opacity-50 transition-opacity"
              >
                <SciIcon type="incident" code={inc.type} size={13} />
                <span className="text-[10px] font-mono text-slate-400">{inc.clave}</span>
              </button>
            )
          })}
        </>
      )}
    </div>
  )
}

// ── Log tab ────────────────────────────────────────────────────

const LEVEL_BADGE = {
  critical: 'text-red-300 bg-red-950/60',
  dispatch: 'text-amber-300 bg-amber-950/60',
  info:     'text-slate-400 bg-slate-800/60',
  arrival:  'text-emerald-300 bg-emerald-950/60',
}
const LEVEL_LABEL_SHORT = {
  critical: 'CRIT',
  dispatch: 'DSP',
  info:     'INFO',
  arrival:  'ARR',
}

function RegistroTab({ onOpenExport }) {
  const { state } = useAppContext()
  const log = state.sci.eventLog

  if (log.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-2">
        <p className="text-[10px] text-slate-600">Sin eventos.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Export button */}
      <div className="shrink-0 px-2 py-1.5 border-b border-slate-800/60 flex items-center justify-between">
        <span className="text-[9px] text-slate-600 font-mono">{log.length} entradas</span>
        <button
          onClick={onOpenExport}
          className="text-[9px] text-slate-500 hover:text-slate-200 transition-colors font-mono"
        >↓ Exportar</button>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-1.5 space-y-px font-mono text-[9px]">
        {[...log].reverse().map((entry, i) => {
          const lvBadge = LEVEL_BADGE[entry.level] ?? LEVEL_BADGE.info
          const lvLabel = LEVEL_LABEL_SHORT[entry.level] ?? 'INFO'
          return (
            <div key={i} className="flex items-start gap-1.5 py-0.5 hover:bg-slate-800/30 px-1 rounded">
              <span className={`shrink-0 px-1 rounded text-[7px] font-bold leading-4 mt-0.5 ${lvBadge}`}>
                {lvLabel}
              </span>
              <span className="text-slate-700 shrink-0 whitespace-nowrap leading-relaxed">
                {new Date(entry.t).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className="text-slate-400 leading-relaxed break-words min-w-0">{entry.msg}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main sidebar ───────────────────────────────────────────────

export default function SciSidebar({ onOpenExport, forcedTab }) {
  const { state } = useAppContext()
  const { sci } = state
  const [manualTab, setManualTab] = useState('incidentes')

  // Auto-switch to Incidentes when simulation fires first event
  useEffect(() => {
    if (sci.mode === 'auto' && sci.incidents.length > 0) {
      setManualTab('incidentes') // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [sci.mode, sci.incidents.length > 0]) // eslint-disable-line

  // forcedTab is a one-shot signal (may include _timestamp suffix to force re-trigger)
  // Sync it into manualTab once; then user can switch tabs freely
  useEffect(() => {
    if (forcedTab) {
      const tab = forcedTab.split('_')[0]
      if (tab) setManualTab(tab) // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [forcedTab]) // eslint-disable-line

  const activeTab = manualTab
  const setActiveTab = setManualTab

  const activeIncidents = sci.incidents.filter(i => i.status === 'active').length
  const logCount        = sci.eventLog.length
  const critCount       = sci.eventLog.filter(e => e.level === 'critical').length

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute left-2 z-[800] w-64 flex flex-col bg-[#080f18]/95 backdrop-blur-md border border-slate-700/40 rounded-xl shadow-xl overflow-hidden"
      style={{ top: '6.5rem', bottom: '1rem' }}
    >
      {/* ICS Command panel */}
      <SciCommandPanel />

      {/* Sim banner */}
      {sci.mode === 'auto' && sci.autoTimeline && (
        <div className="shrink-0 px-3 py-1 bg-red-950/60 border-b border-red-900/40 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shrink-0" />
          <span className="text-[9px] font-bold text-red-300 uppercase tracking-wider">Simulación</span>
          <span className="ml-auto text-[9px] text-red-400 font-mono">
            {activeIncidents} inc.
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="shrink-0 flex border-b border-slate-700/40">
        {TABS.map(t => {
          const badge =
            t.key === 'incidentes' ? activeIncidents :
            t.key === 'registro'   ? (critCount > 0 ? critCount : logCount) : 0
          const isAlert = t.key === 'registro' && critCount > 0

          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex-1 py-2 flex flex-col items-center gap-0.5 transition-colors relative ${
                activeTab === t.key
                  ? 'text-slate-100 border-b-2 border-slate-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {(() => { const Icon = TAB_ICONS[t.key]; return <Icon size={13} strokeWidth={1.75} /> })()}
              <span className="text-[8px] leading-none tracking-wide">{t.label}</span>
              {badge > 0 && (
                <span className={`absolute top-1 right-2.5 text-[7px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center ${
                  isAlert ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-700 text-slate-300'
                }`}>
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {activeTab === 'recursos'   && <ResourcesTab />}
        {activeTab === 'incidentes' && <IncidentsTab />}
        {activeTab === 'registro'   && <RegistroTab onOpenExport={onOpenExport} />}
      </div>
    </motion.div>
  )
}
