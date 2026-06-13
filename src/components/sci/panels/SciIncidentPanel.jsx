import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion' // eslint-disable-line no-unused-vars
import { useAppContext } from '../../../context/AppContext.jsx'
import { SCI_INCIDENT_TYPES } from '../../../constants/sciIncidentTypes.js'
import { SCI_DEPENDENCIES } from '../../../constants/sciDependencies.js'
import { SCI_ZONE_TYPES } from '../../../constants/sciZoneTypes.js'
import { calcEtaMs, fmtEta } from '../../../utils/etaModel.js'
import SciIcon from '../SciIcon.jsx'
import { ESF } from '../../../constants/esfFunctions.js'

const ZONE_DEF = [
  { key: 'red',    label: 'Caliente', color: '#ef4444', max: 5000 },
  { key: 'yellow', label: 'Tibia',    color: '#f59e0b', max: 8000 },
  { key: 'green',  label: 'Fría',     color: '#22c55e', max: 12000 },
]

// Legible labels for incident field keys; null = hide
const FIELD_LABELS = {
  // Sismo
  magnitud:            'Mag.',
  profundidad:         'Prof. km',
  intensidadMercalli:  'Mercalli',
  tsunami:             'Tsunami',
  replicas:            'Réplicas',
  epicentroLat:        null,
  epicentroLng:        null,
  // Colapso
  tipoEdificio:   'Tipo',
  pisos:          'Pisos',
  atrapados:      'Atrap.',
  // Común
  victimas:       'Víct.',
  descripcion:    'Desc.',
  notas:          'Notas',
  // Tsunami
  alturaOla:      'Ola m',
  velocidad:      'Vel. km/h',
  alertaTemprana: 'Alerta',
  // Falla eléctrica
  coloniaAfectada:  'Zona',
  usrAfectados:     'Usuarios',
  tipoFalla:        'Tipo falla',
  hospitalesAfect:  'Hosp. afect.',
  // Hundimiento
  diametro:       'Diám. m',
  causa:          'Causa',
  vehAtrap:       'Veh. atrap.',
  // Inundación pluvial
  nivelAgua:      'Nivel cm',
  alcaldia:       'Alcaldía',
  vialidades:     'Vial. bloq.',
  // Disturbio
  personasEst:    'Personas',
  nivel:          'Nivel',
  vialBloq:       'Vial. bloq.',
}

export default function SciIncidentPanel({ onOpenForms, onClose }) {
  const { state, dispatch } = useAppContext()
  const id = state.sci.selectedIncidentId
  const incident = id != null ? state.sci.incidents.find(i => i.id === id) : null
  const [editingZones, setEditingZones] = useState(false)
  const [zones, setZones] = useState(null)
  const [assignDest, setAssignDest] = useState(null) // null = incident location (default)

  // Must be before early return — hooks cannot be conditional
  const incidentDests = useMemo(() => {
    if (!incident) return []
    const base = [{ key: 'incident', label: 'Incidente', icon: '📍', lat: incident.lat, lng: incident.lng }]
    const zoneOrder = ['pc', 'acv', 'staging', 'triage', 'helipuerto']
    for (const zKey of zoneOrder) {
      const found = state.sci.zones.find(z => z.type === zKey && (!z.incidentId || z.incidentId === incident.id))
      if (found) {
        const def = SCI_ZONE_TYPES[zKey]
        base.push({ key: zKey, label: def.label, icon: def.icon, lat: found.lat, lng: found.lng })
      }
    }
    return base
  }, [incident, state.sci.zones])

  if (!incident) return null

  const effectiveDest = assignDest ?? incidentDests[0]

  const typeDef = SCI_INCIDENT_TYPES[incident.type] ?? {}
  const assignedUnits = (incident.assignedUnitIds ?? [])
    .map(rid => state.sci.resources.byId[rid])
    .filter(Boolean)
  const availableUnits = state.sci.resources.allIds
    .map(rid => state.sci.resources.byId[rid])
    .filter(r => r && r.state === 'disponible' && r.mobile)
  const isClosed = incident.status === 'closed'
  const children = state.sci.incidents.filter(i => i.parentId === incident.id)

  const openZoneEdit = () => { setZones({ ...incident.zones }); setEditingZones(true) }
  const saveZones    = () => {
    dispatch({ type: 'SCI_UPDATE_INCIDENT_ZONES', payload: { id: incident.id, zones } })
    setEditingZones(false)
  }
  const handleAssign = (resourceId) => {
    const r = state.sci.resources.byId[resourceId]
    if (!r) return
    const dest = effectiveDest
    const eta = calcEtaMs({
      originLat: r.lat, originLng: r.lng,
      destLat: dest.lat, destLng: dest.lng,
      typeCode: r.typeCode,
      emergency: true,
    })
    dispatch({ type: 'SCI_ASSIGN_RESOURCE', payload: {
      resourceId, incidentId: incident.id,
      waypoints: [[r.lat, r.lng], [dest.lat, dest.lng]],
      eta,
    }})
  }

  // Visible fields (exclude hidden keys)
  const visibleFields = incident.fields
    ? Object.entries(incident.fields).filter(([k]) => FIELD_LABELS[k] !== null)
    : []

  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      className="absolute right-2 z-[800] w-76 flex flex-col bg-[#0c1520]/95 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-xl overflow-hidden"
      style={{ top: '6.5rem', maxHeight: 'calc(100vh - 8rem)', width: '17rem' }}
    >
      {/* Header */}
      <div className="shrink-0 px-3 py-2.5 border-b border-slate-700/50">
        <div className="flex items-center gap-2.5">
          <span className="shrink-0 flex items-center justify-center w-5 h-5">
            <SciIcon type="incident" code={incident.type} size={16} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-mono font-bold text-slate-100">{incident.clave}</span>
              {isClosed && (
                <span className="text-[9px] bg-slate-700 text-slate-400 px-1.5 rounded">CERR.</span>
              )}
            </div>
            <div className="text-[10px] text-slate-500 truncate">{typeDef.label}</div>
          </div>
          <button
            onClick={() => onClose ? onClose() : dispatch({ type: 'SCI_SELECT_INCIDENT', payload: null })}
            title="Volver a la guía"
            className="text-slate-500 hover:text-slate-200 text-lg leading-none shrink-0"
          >×</button>
        </div>
        {/* ESF badges */}
        {typeDef.esfTags?.length > 0 && (
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {typeDef.esfTags.slice(0, 3).map(tag => {
              const esf = ESF[tag]
              return (
                <span
                  key={tag}
                  title={esf?.label}
                  className="text-[8px] font-mono font-semibold px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: (esf?.color ?? '#475569') + '30', color: esf?.color ?? '#94a3b8', border: `1px solid ${(esf?.color ?? '#475569')}40` }}
                >{tag}</span>
              )
            })}
          </div>
        )}
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3.5">

        {/* Fields */}
        {visibleFields.length > 0 && (
          <div className="space-y-1 bg-slate-800/40 rounded-lg px-2.5 py-2">
            {visibleFields.map(([k, v]) => {
              const label = FIELD_LABELS[k] ?? k
              return (
                <div key={k} className="flex justify-between gap-3 text-[10px]">
                  <span className="text-slate-500 shrink-0">{label}</span>
                  <span className="text-slate-300 font-mono text-right truncate">{String(v)}</span>
                </div>
              )
            })}
          </div>
        )}

        {/* Zones */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Zonas</span>
            {!isClosed && (
              <button
                onClick={editingZones ? saveZones : openZoneEdit}
                className="text-[10px] text-slate-500 hover:text-slate-200 transition-colors"
              >{editingZones ? 'Guardar' : 'Editar'}</button>
            )}
          </div>
          <AnimatePresence mode="wait">
            {editingZones && zones ? (
              <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2.5">
                {ZONE_DEF.map(z => (
                  <div key={z.key}>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span style={{ color: z.color }}>● {z.label}</span>
                      <span className="text-slate-300 font-mono">{zones[z.key]} m</span>
                    </div>
                    <input type="range" min={20} max={z.max} step={10}
                      value={zones[z.key]}
                      onChange={e => setZones(s => ({ ...s, [z.key]: Number(e.target.value) }))}
                      className="w-full h-1 rounded" style={{ accentColor: z.color }}
                    />
                  </div>
                ))}
                <button onClick={() => setEditingZones(false)}
                  className="text-[10px] text-slate-500 hover:text-slate-300">Cancelar</button>
              </motion.div>
            ) : (
              <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="grid grid-cols-3 gap-1">
                {ZONE_DEF.map(z => (
                  <div key={z.key} className="bg-slate-800/60 rounded px-1.5 py-1.5 text-center">
                    <div className="text-[8px] font-semibold mb-0.5" style={{ color: z.color }}>{z.label}</div>
                    <div className="text-[11px] font-mono text-slate-200">{incident.zones[z.key]}m</div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Assigned units */}
        <div>
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Unidades · {assignedUnits.length}
          </div>
          {assignedUnits.length === 0 && (
            <p className="text-[10px] text-slate-600 italic">Sin asignar</p>
          )}
          <div className="space-y-1">
            {assignedUnits.map(r => {
              const _dep = SCI_DEPENDENCIES[r.dependency]
              return (
                <div key={r.id} className="flex items-center bg-slate-800/50 rounded px-2 py-1.5 gap-1.5">
                  <SciIcon type="dep" code={r.dependency} size={13} className="shrink-0" />
                  <span className="text-[10px] text-slate-300 flex-1 truncate">{r.label}</span>
                  {r.eta != null && r.eta > 0 && (
                    <span className="text-[9px] text-amber-400 font-mono shrink-0">{fmtEta(r.eta)}</span>
                  )}
                  {!isClosed && (
                    <button
                      onClick={() => dispatch({ type: 'SCI_UNASSIGN_RESOURCE', payload: { resourceId: r.id } })}
                      className="text-[10px] text-slate-600 hover:text-red-400 transition-colors shrink-0"
                    >✕</button>
                  )}
                </div>
              )
            })}
          </div>

          {/* Assign dropdown manual */}
          {!isClosed && availableUnits.length > 0 && (
            <details className="mt-1.5" onToggle={e => { if (!e.currentTarget.open) setAssignDest(null) }}>
              <summary className="text-[10px] text-slate-500 hover:text-slate-300 cursor-pointer select-none transition-colors">
                + Asignar ({availableUnits.length} disp.)
              </summary>
              <div className="mt-1.5 space-y-1.5">
                {/* Destination picker — only shows if zones exist */}
                {incidentDests.length > 1 && (
                  <div>
                    <div className="text-[9px] text-slate-600 mb-1 px-1">Destino:</div>
                    <div className="flex flex-wrap gap-1 px-0.5">
                      {incidentDests.map(d => (
                        <button
                          key={d.key}
                          onClick={() => setAssignDest(d)}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-semibold border transition-colors ${
                            effectiveDest.key === d.key
                              ? 'bg-sky-600/30 border-sky-500/60 text-sky-300'
                              : 'bg-slate-800 border-slate-700/50 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <span>{d.icon}</span>
                          <span>{d.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="max-h-36 overflow-y-auto space-y-px bg-slate-900/60 rounded p-1">
                  {availableUnits.slice(0, 30).map(r => {
                    const dep = SCI_DEPENDENCIES[r.dependency]
                    return (
                      <button key={r.id} onClick={() => handleAssign(r.id)}
                        className="w-full flex items-center gap-2 text-[10px] text-slate-300 hover:bg-slate-800 px-2 py-1 rounded text-left">
                        <SciIcon type="dep" code={r.dependency} size={12} className="shrink-0" />
                        <span className="truncate flex-1">{r.label}</span>
                        <span className="text-[9px] text-slate-500 shrink-0 font-mono">{dep?.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </details>
          )}
        </div>

        {/* Secondary incidents */}
        {children.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Secundarios · {children.length}
            </div>
            <div className="space-y-1">
              {children.map(c => {
                const _ct = SCI_INCIDENT_TYPES[c.type] ?? {}
                return (
                  <button key={c.id}
                    onClick={() => dispatch({ type: 'SCI_SELECT_INCIDENT', payload: c.id })}
                    className="w-full flex items-center gap-2 text-[10px] bg-slate-800/60 hover:bg-slate-700/60 px-2 py-1.5 rounded transition-colors">
                    <SciIcon type="incident" code={c.type} size={12} />
                    <span className="font-mono text-slate-200">{c.clave}</span>
                    <span className="ml-auto text-[9px] text-slate-500">{c.status}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Bitácora */}
        {incident.log.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Bitácora</div>
            <div className="space-y-px max-h-28 overflow-y-auto">
              {[...incident.log].reverse().map((entry, i) => (
                <div key={i} className="text-[9px] text-slate-500 font-mono leading-relaxed px-1">
                  <span className="text-slate-700">
                    {new Date(entry.t).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  {' '}{entry.msg}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 px-3 py-2 border-t border-slate-700/50 space-y-1.5">
        {/* IC line */}
        {state.sci.command?.IC && (
          <div className="flex items-center gap-1.5 text-[9px] text-slate-500">
            <span className="font-semibold text-slate-600 uppercase tracking-wider">IC</span>
            <span className="text-slate-400 truncate">{state.sci.command.IC}</span>
          </div>
        )}
        {/* ICS Forms button — always visible */}
        {onOpenForms && (
          <button
            onClick={() => onOpenForms(incident.id)}
            className="w-full py-1.5 text-[10px] font-semibold bg-orange-500/10 hover:bg-orange-500/20 border border-orange-600/30 rounded-lg text-orange-400 hover:text-orange-300 transition-colors"
          >Generar formatos ICS</button>
        )}
        {!isClosed && (
          <div className="flex gap-2">
            <button onClick={() => dispatch({ type: 'SCI_START_CREATION', payload: { parentId: incident.id } })}
              className="flex-1 py-1.5 text-[10px] bg-slate-800/80 hover:bg-slate-700 border border-slate-700/50 rounded-lg text-slate-400 hover:text-slate-200 transition-colors">
              + Secundario
            </button>
            <button
              onClick={() => {
                dispatch({ type: 'SCI_CLOSE_INCIDENT', payload: incident.id })
                dispatch({ type: 'SCI_SELECT_INCIDENT', payload: null })
              }}
              className="flex-1 py-1.5 text-[10px] border border-red-900/40 rounded-lg text-red-400 hover:bg-red-900/20 transition-colors">
              Cerrar
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}
