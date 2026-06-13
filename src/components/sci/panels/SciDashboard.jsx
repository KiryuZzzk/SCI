import { useMemo, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppContext } from '../../../context/AppContext.jsx'
import { computeAarMetrics } from '../../../utils/icsForms/aar.js'
import { SCI_INCIDENT_TYPES } from '../../../constants/sciIncidentTypes.js'
import { SCI_DEPENDENCIES } from '../../../constants/sciDependencies.js'
import { resolveChecklist, checklistProgress } from '../../../utils/sciChecklistEngine.js'
import { fmtEta } from '../../../utils/etaModel.js'
import SciIcon from '../SciIcon.jsx'
import {
  X, Activity, Truck, Clock, ClipboardCheck, AlertTriangle, Radio,
} from 'lucide-react'

function fmtClock(d, utc = true) {
  const h = utc ? d.getUTCHours() : d.getHours()
  const m = utc ? d.getUTCMinutes() : d.getMinutes()
  const s = utc ? d.getUTCSeconds() : d.getSeconds()
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}${utc ? 'Z' : ''}`
}

function fmtDur(ms) {
  if (ms == null) return '—'
  const min = Math.floor(ms / 60000)
  const h = Math.floor(min / 60)
  return h > 0 ? `${h}h ${min % 60}m` : `${min}m`
}

const STATE_META = {
  disponible:      { label: 'Disponibles', color: '#22c55e' },
  asignado:        { label: 'Asignados',   color: '#f59e0b' },
  enroute:         { label: 'En tránsito', color: '#3b82f6' },
  'on-scene':      { label: 'En escena',   color: '#fb923c' },
  'no-disponible': { label: 'No disp.',     color: '#64748b' },
}

function KpiCard({ Icon, label, value, sub, color }) {
  return (
    <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl px-4 py-3 flex flex-col">
      <div className="flex items-center gap-1.5 text-slate-500 mb-1">
        <Icon size={12} strokeWidth={2} />
        <span className="text-[9px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-[28px] font-bold font-mono leading-none" style={{ color }}>{value}</div>
      {sub && <div className="text-[9px] text-slate-500 mt-1">{sub}</div>}
    </div>
  )
}

export default function SciDashboard({ open, onClose }) {
  const { state } = useAppContext()
  const { sci } = state
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    if (!open) return
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [open])

  const activeOp = sci.operationalPeriods?.find(op => op.id === sci.activeOpId)

  const m = useMemo(() => computeAarMetrics(sci, activeOp), [sci, activeOp])

  // Estado de recursos agregado
  const byState = useMemo(() => {
    const acc = {}
    for (const r of m.resources) {
      acc[r.state] = (acc[r.state] ?? 0) + 1
    }
    return acc
  }, [m.resources])

  // Incidentes activos con checklist % y unidades
  const activeIncidents = useMemo(() => {
    return m.active.map(inc => {
      const resolved = resolveChecklist(inc, sci)
      const pct = checklistProgress(resolved).pct
      const victims = Number(inc.fields?.victimas ?? inc.fields?.atrapados ?? 0) || 0
      const critical = victims >= 5 || (inc.zones?.red ?? 0) >= 500
      return { ...inc, checklistPct: pct, units: inc.assignedUnitIds?.length ?? 0, victims, critical }
    }).sort((a, b) => (b.critical - a.critical) || (b.victims - a.victims))
  }, [m.active, sci])

  const critEvents = useMemo(() => [...m.critEvents].reverse().slice(0, 12), [m.critEvents])

  if (!open) return null

  const engagedColor = m.engagementPct > 80 ? '#ef4444' : m.engagementPct > 50 ? '#f59e0b' : '#22c55e'
  const checklistColor = m.avgChecklist >= 60 ? '#22c55e' : '#fb923c'

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1400] bg-[#060b12]/98 backdrop-blur-md flex flex-col"
        >
          {/* Header */}
          <div className="shrink-0 flex items-center gap-4 px-6 py-3 border-b border-slate-700/50 bg-slate-900/40">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[14px] font-bold text-slate-100 tracking-wide">SALA DE MONITOREO · SCI</span>
            </div>
            <div className="text-[11px] text-slate-500">
              {activeOp ? `${activeOp.label} · ${fmtDur(m.opDurationMs)}` : 'Sin período operacional'}
            </div>
            <div className="ml-auto flex items-center gap-4">
              <div className="text-right">
                <div className="font-mono text-[18px] font-bold text-slate-100 tabular-nums leading-none">{fmtClock(now, true)}</div>
                <div className="font-mono text-[9px] text-slate-500 tabular-nums">{fmtClock(now, false)} CDMX</div>
              </div>
              <button onClick={onClose} className="text-slate-500 hover:text-slate-200 transition-colors">
                <X size={22} />
              </button>
            </div>
          </div>

          {/* Body grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* KPI row */}
            <div className="grid grid-cols-6 gap-3 mb-5">
              <KpiCard Icon={Activity} label="Incidentes activos" value={m.active.length}
                sub={`${m.closed.length} cerrados`} color="#f59e0b" />
              <KpiCard Icon={AlertTriangle} label="Eventos críticos" value={m.critEvents.length}
                sub="acumulados" color="#ef4444" />
              <KpiCard Icon={Truck} label="Unidades activas" value={m.engaged.length}
                sub={`de ${m.resources.length} (${m.engagementPct}%)`} color={engagedColor} />
              <KpiCard Icon={Clock} label="ETA promedio" value={m.avgEta ? fmtEta(m.avgEta) : '—'}
                sub={m.maxEta ? `máx ${fmtEta(m.maxEta)}` : null} color="#3b82f6" />
              <KpiCard Icon={ClipboardCheck} label="Checklist SCI" value={`${m.avgChecklist}%`}
                sub="promedio" color={checklistColor} />
              <KpiCard Icon={Radio} label="Dependencias" value={Object.keys(m.byDep).length}
                sub="involucradas" color="#a78bfa" />
            </div>

            {/* 3-column layout */}
            <div className="grid grid-cols-3 gap-4">
              {/* Incidentes activos */}
              <div className="bg-slate-900/40 border border-slate-700/40 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 border-b border-slate-700/40 text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Incidentes activos
                </div>
                <div className="p-2 space-y-1.5 max-h-[calc(100vh-340px)] overflow-y-auto">
                  {activeIncidents.length === 0 ? (
                    <div className="text-center py-8 text-[11px] text-slate-600 italic">Sin incidentes activos</div>
                  ) : (
                    activeIncidents.map(inc => {
                      const def = SCI_INCIDENT_TYPES[inc.type]
                      return (
                        <div key={inc.id} className={`rounded-lg p-2.5 border ${inc.critical ? 'bg-red-950/30 border-red-800/40' : 'bg-slate-800/40 border-slate-700/30'}`}>
                          <div className="flex items-center gap-2">
                            <SciIcon type="incident" code={inc.type} size={15} className="shrink-0" />
                            <span className="text-[11px] font-mono font-bold text-slate-100">{inc.clave}</span>
                            {inc.critical && (
                              <span className="text-[8px] font-bold px-1 rounded bg-red-600 text-white">CRÍTICO</span>
                            )}
                            <span className="ml-auto text-[9px] text-slate-500">{def?.label}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 text-[9px]">
                            <span className="text-slate-400">{inc.units} unid.</span>
                            {inc.victims > 0 && <span className="text-amber-400">{inc.victims} víct.</span>}
                            <div className="ml-auto flex items-center gap-1.5">
                              <div className="w-16 h-1 rounded-full bg-slate-700/50 overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${inc.checklistPct}%`, backgroundColor: inc.checklistPct >= 60 ? '#22c55e' : '#fb923c' }} />
                              </div>
                              <span className="font-mono text-slate-500 w-7 text-right">{inc.checklistPct}%</span>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Recursos */}
              <div className="bg-slate-900/40 border border-slate-700/40 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 border-b border-slate-700/40 text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Estado de recursos
                </div>
                <div className="p-3 space-y-3">
                  {/* Por estado — barras */}
                  <div className="space-y-1.5">
                    {Object.entries(STATE_META).map(([key, meta]) => {
                      const count = byState[key] ?? 0
                      const pct = m.resources.length ? (count / m.resources.length) * 100 : 0
                      return (
                        <div key={key}>
                          <div className="flex items-center justify-between text-[9px] mb-0.5">
                            <span className="text-slate-400">{meta.label}</span>
                            <span className="font-mono text-slate-300">{count}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: meta.color }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {/* Por dependencia */}
                  <div className="pt-2 border-t border-slate-700/40">
                    <div className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Por dependencia</div>
                    <div className="space-y-1 max-h-[calc(100vh-540px)] overflow-y-auto">
                      {Object.entries(m.byDep).sort((a, b) => b[1].engaged - a[1].engaged).map(([dep, s]) => (
                        <div key={dep} className="flex items-center gap-2 text-[10px]">
                          <SciIcon type="dep" code={dep} size={12} className="shrink-0" />
                          <span className="text-slate-400 flex-1 truncate">{SCI_DEPENDENCIES[dep]?.label ?? dep}</span>
                          <span className="font-mono text-amber-400">{s.engaged}</span>
                          <span className="font-mono text-slate-600">/ {s.total}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Eventos críticos */}
              <div className="bg-slate-900/40 border border-slate-700/40 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 border-b border-slate-700/40 text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  Eventos críticos
                </div>
                <div className="p-2 space-y-1 max-h-[calc(100vh-340px)] overflow-y-auto">
                  {critEvents.length === 0 ? (
                    <div className="text-center py-8 text-[11px] text-slate-600 italic">Sin eventos críticos</div>
                  ) : (
                    critEvents.map((e, i) => (
                      <div key={i} className="flex gap-2 px-2 py-1.5 rounded bg-slate-800/30">
                        <span className="font-mono text-[8.5px] text-slate-600 shrink-0 pt-0.5">
                          {new Date(e.t).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-[10px] text-red-300 leading-snug">{e.msg}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer hint */}
          <div className="shrink-0 px-6 py-1.5 border-t border-slate-700/40 text-[9px] text-slate-600 flex items-center gap-3">
            <span>Tecla <kbd className="font-mono bg-slate-800/60 rounded px-1">D</kbd> o <kbd className="font-mono bg-slate-800/60 rounded px-1">ESC</kbd> para cerrar</span>
            <span className="ml-auto">CoberturaECMX · Sala de monitoreo en vivo</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
