import { useMemo, useState } from 'react'
import { motion } from 'framer-motion' // eslint-disable-line no-unused-vars
import { useAppContext } from '../../../context/AppContext.jsx'
import { SCI_DEPENDENCIES } from '../../../constants/sciDependencies.js'
import { SCI_INCIDENT_TYPES } from '../../../constants/sciIncidentTypes.js'
import { SCI_ZONE_TYPES } from '../../../constants/sciZoneTypes.js'
import SciIcon from '../SciIcon.jsx'
import { fmtEta, calcEtaMs } from '../../../utils/etaModel.js'
import { getTemplate } from '../../../constants/sciUnitTemplates.js'
import { NIMS_TYPE, NIMS_TYPE_COLOR } from '../../../constants/nimsResourceTyping.js'
import { STATUS_CODES } from '../../../constants/sciStatusCodes.js'
import { generateCrew, generateEquipoStatus } from '../../../utils/sciCrewGenerator.js'
import { Users, Wrench, Building2, Activity, Radio, ChevronRight, MapPin } from 'lucide-react'

const STATE_STYLE = {
  disponible:      { label: 'Disponible', cls: 'text-emerald-400', dot: 'bg-emerald-500' },
  asignado:        { label: 'Asignado',   cls: 'text-amber-400',   dot: 'bg-amber-500'   },
  enroute:         { label: 'En tránsito',cls: 'text-blue-400',    dot: 'bg-blue-500'    },
  'on-scene':      { label: 'En escena',  cls: 'text-orange-400',  dot: 'bg-orange-500'  },
  'no-disponible': { label: 'No disp.',   cls: 'text-slate-500',   dot: 'bg-slate-600'   },
}

const EQ_STATUS_STYLE = {
  operativo:      { label: 'OP',  cls: 'bg-emerald-900/40 text-emerald-400 border-emerald-700/40' },
  desgaste:       { label: 'DG',  cls: 'bg-amber-900/40 text-amber-400 border-amber-700/40' },
  mantenimiento:  { label: 'MNT', cls: 'bg-red-900/40 text-red-400 border-red-700/40' },
}

const TABS = [
  { key: 'info',     label: 'Info',     Icon: Activity },
  { key: 'personal', label: 'Personal', Icon: Users },
  { key: 'equipo',   label: 'Equipo',   Icon: Wrench },
]

export default function SciUnitDetailPanel() {
  const { state, dispatch } = useAppContext()
  const id = state.sci.selectedResourceId
  const r = id ? state.sci.resources.byId[id] : null
  const [tab, setTab] = useState('info')
  const [assignOpen, setAssignOpen] = useState(false)
  const [pendingIncId, setPendingIncId] = useState(null) // which incident is showing dest picker
  const [pendingDest, setPendingDest] = useState(null)   // selected destination for pending incident

  const dep = r ? SCI_DEPENDENCIES[r.dependency] : null
  const tpl = r ? getTemplate(r.typeCode) : null
  const incident = r?.assignedIncidentId
    ? state.sci.incidents.find(i => i.id === r.assignedIncidentId)
    : null
  const activeIncidents = useMemo(
    () => state.sci.incidents.filter(i => i.status === 'active'),
    [state.sci.incidents],
  )

  const handleAssignTo = (incidentId, destLat, destLng) => {
    const inc = state.sci.incidents.find(i => i.id === incidentId)
    if (!inc || !r) return
    const dLat = destLat ?? inc.lat
    const dLng = destLng ?? inc.lng
    const eta = calcEtaMs({
      originLat: r.lat, originLng: r.lng,
      destLat: dLat, destLng: dLng,
      typeCode: r.typeCode, emergency: true,
    })
    dispatch({ type: 'SCI_ASSIGN_RESOURCE', payload: {
      resourceId: r.id, incidentId,
      waypoints: [[r.lat, r.lng], [dLat, dLng]],
      eta,
    }})
    setAssignOpen(false)
    setPendingIncId(null)
    setPendingDest(null)
  }

  // Compute destinations for a given incident
  const getDestinations = (inc) => {
    const dests = [{ key: 'incident', label: 'Incidente', icon: '📍', lat: inc.lat, lng: inc.lng }]
    for (const zKey of ['pc', 'acv', 'staging', 'triage', 'helipuerto']) {
      const found = state.sci.zones.find(z => z.type === zKey && (!z.incidentId || z.incidentId === inc.id))
      if (found) {
        const def = SCI_ZONE_TYPES[zKey]
        dests.push({ key: zKey, label: def.label, icon: def.icon, lat: found.lat, lng: found.lng })
      }
    }
    return dests
  }

  // Crew + equipo memoized — same id, same data
  const crew = useMemo(() => generateCrew(r?.id, tpl?.personal), [r?.id, tpl?.personal])
  const equipoStatus = useMemo(() => generateEquipoStatus(r?.id, tpl?.equipo), [r?.id, tpl?.equipo])

  if (!r) return null
  const stInfo = STATE_STYLE[r.state] ?? STATE_STYLE.disponible

  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      className="absolute right-2 z-[800] flex flex-col bg-[#0c1520]/95 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-xl overflow-hidden"
      style={{ top: '6.5rem', maxHeight: 'calc(100vh - 8rem)', width: '17rem' }}
    >
      {/* Header */}
      <div className="shrink-0 px-3 py-2.5 border-b border-slate-700/50 flex items-center gap-2">
        <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded bg-slate-800/60">
          <SciIcon type="dep" code={r.dependency} size={14} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-semibold text-slate-100 truncate leading-tight">{r.label}</div>
          <div className="text-[9px] text-slate-500 flex items-center gap-1.5">
            <span>{dep?.label}</span>
            {STATUS_CODES[r.state] && (
              <span className="font-mono text-slate-600">· {STATUS_CODES[r.state].code}</span>
            )}
          </div>
        </div>
        <button
          onClick={() => dispatch({ type: 'SCI_SELECT_RESOURCE', payload: null })}
          className="text-slate-500 hover:text-slate-200 text-lg leading-none shrink-0"
        >×</button>
      </div>

      {/* Status bar */}
      <div className="shrink-0 px-3 py-1.5 border-b border-slate-700/40 bg-slate-900/40 flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${stInfo.dot} animate-pulse`} />
        <span className={`text-[10px] font-semibold ${stInfo.cls}`}>{stInfo.label}</span>
        {tpl && NIMS_TYPE[r.typeCode] && (
          <span
            className="ml-auto text-[8px] font-bold font-mono px-1 py-0.5 rounded"
            style={{ color: NIMS_TYPE_COLOR[NIMS_TYPE[r.typeCode]], border: `1px solid ${NIMS_TYPE_COLOR[NIMS_TYPE[r.typeCode]]}50` }}
          >NIMS T-{NIMS_TYPE[r.typeCode]}</span>
        )}
      </div>

      {/* Tabs */}
      <div className="shrink-0 flex border-b border-slate-700/40 bg-slate-900/30">
        {TABS.map(t => {
          const active = tab === t.key
          const count = t.key === 'personal' ? crew.length : t.key === 'equipo' ? equipoStatus.length : null
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-semibold transition-all border-b-2 ${
                active
                  ? 'text-slate-100 border-amber-500'
                  : 'text-slate-500 border-transparent hover:text-slate-300'
              }`}
            >
              <t.Icon size={11} strokeWidth={2} />
              <span>{t.label}</span>
              {count != null && count > 0 && (
                <span className={`text-[8px] font-mono px-1 rounded ${active ? 'bg-slate-700 text-slate-200' : 'bg-slate-800 text-slate-500'}`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
        {tab === 'info' && (
          <>
            {/* Tipo + capacidad */}
            {tpl && (
              <div className="bg-slate-800/40 rounded-lg px-2.5 py-2 space-y-1.5">
                <div className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Especificación</div>
                <div className="text-[10.5px] text-slate-200 font-semibold leading-tight">{tpl.label}</div>
                {tpl.descripcion && (
                  <p className="text-[10px] text-slate-400 leading-snug">{tpl.descripcion}</p>
                )}
                {tpl.capacidad && (
                  <div className="flex items-start gap-1.5 pt-1 border-t border-slate-700/40">
                    <span className="text-[9px] text-slate-500 shrink-0">Capacidad:</span>
                    <span className="text-[10px] text-slate-200">{tpl.capacidad}</span>
                  </div>
                )}
              </div>
            )}

            {/* Incidente asignado */}
            {incident && (
              <div className="bg-amber-950/30 border border-amber-800/40 rounded-lg px-2.5 py-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-semibold text-amber-400 uppercase tracking-wider">Incidente asignado</span>
                  {r.eta != null && r.eta > 0 && (
                    <span className="text-[9px] text-amber-300 font-mono">ETA {fmtEta(r.eta)}</span>
                  )}
                </div>
                <div className="text-[11px] text-slate-100 font-mono font-bold">{incident.clave}</div>
                <button
                  onClick={() => dispatch({ type: 'SCI_UNASSIGN_RESOURCE', payload: { resourceId: r.id } })}
                  className="text-[9px] text-slate-400 hover:text-red-400 transition-colors flex items-center gap-1"
                >
                  Liberar unidad <ChevronRight size={9} />
                </button>
              </div>
            )}

            {/* Asignar a incidente — solo si disponible y hay activos */}
            {r.state === 'disponible' && r.mobile && activeIncidents.length > 0 && (
              <div className="bg-slate-800/40 rounded-lg border border-slate-700/30 overflow-hidden">
                <button
                  onClick={() => setAssignOpen(o => !o)}
                  className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-slate-700/40 transition-colors text-left"
                >
                  <MapPin size={11} className="text-sky-400 shrink-0" strokeWidth={2} />
                  <span className="text-[10px] font-semibold text-sky-300 flex-1">
                    Asignar a incidente
                  </span>
                  <ChevronRight size={12} className={`text-slate-500 transition-transform ${assignOpen ? 'rotate-90' : ''}`} />
                </button>
                {assignOpen && (
                  <div className="border-t border-slate-700/30 divide-y divide-slate-800/60">
                    {activeIncidents.map(inc => {
                      const iType = SCI_INCIDENT_TYPES[inc.type] ?? {}
                      const dests = getDestinations(inc)
                      const isExpanded = pendingIncId === inc.id
                      const activeDest = isExpanded ? (pendingDest ?? dests[0]) : null
                      return (
                        <div key={inc.id}>
                          <button
                            onClick={() => {
                              if (dests.length === 1) {
                                // No zones — assign immediately to incident location
                                handleAssignTo(inc.id)
                              } else {
                                // Has zones — show destination picker
                                setPendingIncId(isExpanded ? null : inc.id)
                                setPendingDest(null)
                              }
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-slate-700/50 transition-colors text-left"
                          >
                            <SciIcon type="incident" code={inc.type} size={12} className="shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-[10px] font-mono font-bold text-slate-100">{inc.clave}</div>
                              <div className="text-[8.5px] text-slate-500 truncate">{iType.label}</div>
                            </div>
                            <span className="text-[8.5px] text-sky-400 font-semibold shrink-0">
                              {dests.length > 1 ? (isExpanded ? '▲' : '▼') : 'Asignar →'}
                            </span>
                          </button>
                          {/* Destination picker (inline, expands when incident has zones) */}
                          {isExpanded && (
                            <div className="bg-slate-900/60 px-2.5 py-2 space-y-2">
                              <div className="text-[9px] text-slate-500">Destino:</div>
                              <div className="flex flex-wrap gap-1">
                                {dests.map(d => (
                                  <button
                                    key={d.key}
                                    onClick={() => setPendingDest(d)}
                                    className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-semibold border transition-colors ${
                                      activeDest.key === d.key
                                        ? 'bg-sky-600/30 border-sky-500/60 text-sky-300'
                                        : 'bg-slate-800 border-slate-700/50 text-slate-400 hover:text-slate-200'
                                    }`}
                                  >
                                    <span>{d.icon}</span>
                                    <span>{d.label}</span>
                                  </button>
                                ))}
                              </div>
                              <button
                                onClick={() => handleAssignTo(inc.id, activeDest.lat, activeDest.lng)}
                                className="w-full py-1 rounded text-[9px] font-semibold bg-sky-600/20 border border-sky-500/40 text-sky-300 hover:bg-sky-600/30 transition-colors"
                              >
                                Asignar → {activeDest.icon} {activeDest.label}
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Hospital capacity */}
            {tpl?.hospitalCapacity && (
              <div className="bg-slate-800/40 rounded-lg px-2.5 py-2 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Building2 size={11} className="text-slate-500" strokeWidth={1.75} />
                  <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">
                    Hospital · Nivel {tpl.hospitalCapacity.nivelAtencion}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  {[
                    ['Camas',     tpl.hospitalCapacity.camasCensables],
                    ['UCI',       tpl.hospitalCapacity.camasUCI],
                    ['Urgencias', tpl.hospitalCapacity.camasUrgencias],
                    ['Quirófanos',tpl.hospitalCapacity.quirofanos],
                  ].map(([lbl, val]) => (
                    <div key={lbl} className="bg-slate-900/50 rounded px-1.5 py-1 flex items-center justify-between">
                      <span className="text-slate-500 text-[9px]">{lbl}</span>
                      <span className="text-slate-100 font-mono font-bold">{val}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1">
                  {tpl.hospitalCapacity.helipuerto && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-blue-900/40 border border-blue-700/40 text-blue-300">Helipuerto</span>
                  )}
                  {tpl.hospitalCapacity.traumaCenter && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-red-900/40 border border-red-700/40 text-red-300">Trauma</span>
                  )}
                  {tpl.hospitalCapacity.bancoSangre && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-rose-900/40 border border-rose-700/40 text-rose-300">Bco. Sangre</span>
                  )}
                  {tpl.hospitalCapacity.tomografia && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-300">TAC</span>
                  )}
                </div>
              </div>
            )}

            {/* ACV capacity */}
            {tpl?.acvCapacity && (
              <div className="bg-slate-800/40 rounded-lg px-2.5 py-2 space-y-1.5">
                <div className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">
                  ACV · Triage {tpl.acvCapacity.equipoTriage}
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                  <div className="bg-slate-900/50 rounded px-1.5 py-1 text-center">
                    <div className="text-[9px] text-slate-500">Cap.</div>
                    <div className="font-mono font-bold text-slate-100">{tpl.acvCapacity.capacidadTotal}</div>
                  </div>
                  <div className="bg-slate-900/50 rounded px-1.5 py-1 text-center">
                    <div className="text-[9px] text-slate-500">Camillas</div>
                    <div className="font-mono font-bold text-slate-100">{tpl.acvCapacity.camillasDisp}</div>
                  </div>
                  <div className="bg-slate-900/50 rounded px-1.5 py-1 text-center">
                    <div className="text-[9px] text-slate-500">Amb.</div>
                    <div className="font-mono font-bold text-slate-100">{tpl.acvCapacity.ambulanciasEnlace}</div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-0.5 pt-1 border-t border-slate-700/40">
                  {Object.entries(tpl.acvCapacity.color).map(([c, n]) => {
                    const cls = { rojo: 'text-red-400', amarillo: 'text-amber-400', verde: 'text-emerald-400', negro: 'text-slate-400' }
                    return (
                      <div key={c} className="text-center">
                        <div className={`text-[11px] font-bold font-mono ${cls[c] ?? 'text-slate-400'}`}>{n}</div>
                        <div className="text-[7px] text-slate-600 capitalize">{c}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Radio / comms — sutil al final */}
            <div className="flex items-center gap-1.5 text-[9px] text-slate-600 px-1">
              <Radio size={10} strokeWidth={1.5} />
              <span>Radio interoperable activa</span>
            </div>
          </>
        )}

        {tab === 'personal' && (
          <>
            {crew.length === 0 ? (
              <div className="text-[10px] text-slate-500 italic text-center py-6">— Sin personal asignado —</div>
            ) : (
              <div className="space-y-1.5">
                {crew.map((p, i) => (
                  <div
                    key={i}
                    className="bg-slate-800/40 hover:bg-slate-800/60 transition-colors rounded-lg px-2.5 py-2 border border-slate-700/30"
                  >
                    <div className="flex items-start gap-2">
                      {/* Avatar inicial */}
                      <div className="shrink-0 w-7 h-7 rounded-full bg-slate-700/60 flex items-center justify-center text-[10px] font-bold text-slate-300 mt-0.5">
                        {p.nombre && p.nombre[0] !== '—' ? p.nombre.split(' ')[0][0] : '·'}
                      </div>
                      <div className="flex-1 min-w-0">
                        {/* Rango badge */}
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[8px] font-mono font-bold text-amber-400 bg-amber-900/30 border border-amber-700/40 rounded px-1 py-0.5 uppercase tracking-wide">
                            {p.rango}
                          </span>
                        </div>
                        {/* Nombre */}
                        <div className="text-[11px] text-slate-100 font-medium leading-tight truncate" title={p.nombre}>
                          {p.nombre ?? '—'}
                        </div>
                        {/* Rol */}
                        <div className="text-[9.5px] text-slate-400 leading-tight mt-0.5">{p.rol}</div>
                        {/* Metadata */}
                        {(p.edad != null || p.servicio != null) && (
                          <div className="flex items-center gap-2 mt-1 text-[8.5px] text-slate-500">
                            {p.edad != null && <span>{p.edad} años</span>}
                            {p.edad != null && p.servicio != null && <span className="text-slate-700">·</span>}
                            {p.servicio != null && <span>{p.servicio} {p.servicio === 1 ? 'año serv.' : 'años serv.'}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'equipo' && (
          <>
            {equipoStatus.length === 0 ? (
              <div className="text-[10px] text-slate-500 italic text-center py-6">— Sin equipo registrado —</div>
            ) : (
              <div className="space-y-1">
                {equipoStatus.map((e, i) => {
                  const sty = EQ_STATUS_STYLE[e.estado] ?? EQ_STATUS_STYLE.operativo
                  return (
                    <div
                      key={i}
                      className="bg-slate-800/40 hover:bg-slate-800/60 transition-colors rounded-md px-2.5 py-1.5 border border-slate-700/30 flex items-center gap-2"
                    >
                      <span className={`shrink-0 text-[8px] font-bold font-mono px-1 py-0.5 rounded border ${sty.cls}`}>
                        {sty.label}
                      </span>
                      <span className="text-[10.5px] text-slate-200 leading-snug flex-1">{e.nombre}</span>
                    </div>
                  )
                })}
              </div>
            )}
            {/* Leyenda estados */}
            <div className="mt-3 pt-2 border-t border-slate-700/40 flex items-center justify-around text-[8.5px] text-slate-500">
              <span><span className="text-emerald-400 font-mono font-bold">OP</span> Operativo</span>
              <span><span className="text-amber-400 font-mono font-bold">DG</span> Desgaste</span>
              <span><span className="text-red-400 font-mono font-bold">MNT</span> Mantto.</span>
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
}
