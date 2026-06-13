import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppContext } from '../../../context/AppContext.jsx'
import { SCI_INCIDENT_TYPES, INCIDENT_TYPE_KEYS } from '../../../constants/sciIncidentTypes.js'
import SciIcon from '../SciIcon.jsx'

function defaultFields(typeDef, lat, lng) {
  const fields = {}
  typeDef.fields.forEach(f => {
    if (f.name === 'epicentroLat') fields[f.name] = lat
    else if (f.name === 'epicentroLng') fields[f.name] = lng
    else fields[f.name] = f.default
  })
  return fields
}

export default function SciIncidentCreator() {
  const { state, dispatch } = useAppContext()
  const { creation } = state.sci
  const open = creation.step === 'form' || creation.step === 'zones'
  const draft = creation.draft

  const [type, setType] = useState(null)
  const [fields, setFields] = useState({})
  const [zones, setZones] = useState({ red: 100, yellow: 300, green: 700 })
  const [clave, setClave] = useState('')

  const typeDef = type ? SCI_INCIDENT_TYPES[type] : null

  // Reset al abrir
  useEffect(() => {
    if (creation.step === 'form' && draft && type === null) {
      setType(null)
      setFields({})
      setClave(`SCI-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`)
    }
    if (creation.step === 'idle') {
      setType(null); setFields({}); setClave('')
    }
  }, [creation.step, draft])

  const previewIncident = useMemo(() => {
    if (creation.step !== 'zones' || !draft || !type) return null
    return { id: -1, lat: draft.lat, lng: draft.lng, type, zones }
  }, [creation.step, draft, type, zones])

  // Live preview de zonas (simple: actualiza el draft en el reducer para que el layer pueda mostrar)
  useEffect(() => {
    if (previewIncident) {
      // Mantenemos el preview localmente; el layer real solo muestra incidentes commiteados.
      // Si quisiéramos preview en mapa, necesitaríamos un canal aparte. Por ahora se confirma al final.
    }
  }, [previewIncident])

  if (!open || !draft) return null

  const pickType = (k) => {
    setType(k)
    const def = SCI_INCIDENT_TYPES[k]
    setFields(defaultFields(def, draft.lat, draft.lng))
    setZones(def.defaultZones)
  }

  const goToZones = () => {
    if (!type) return
    if (!clave.trim()) return alert('Ingresa una clave para el incidente')
    dispatch({ type: 'SCI_SET_DRAFT_STEP', payload: 'zones' })
  }

  const commit = () => {
    dispatch({
      type: 'SCI_COMMIT_INCIDENT',
      payload: {
        type, clave, lat: draft.lat, lng: draft.lng, fields, zones, parentId: draft.parentId ?? null,
      },
    })
  }

  const cancel = () => dispatch({ type: 'SCI_CANCEL_CREATION' })

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-surface border border-surface-3 rounded-2xl shadow-2xl w-[560px] max-h-[85vh] overflow-hidden flex flex-col"
        >
          <div className="px-5 py-3 border-b border-surface-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-display font-bold text-foreground">
                {draft.parentId != null ? 'Nuevo incidente secundario' : 'Nuevo incidente SCI'}
              </div>
              <div className="text-[10px] text-muted font-mono">
                {draft.lat.toFixed(4)}, {draft.lng.toFixed(4)}
              </div>
            </div>
            <button onClick={cancel} className="text-muted hover:text-foreground text-xl leading-none">×</button>
          </div>

          <div className="overflow-y-auto p-5 space-y-4">
            {creation.step === 'form' && (
              <>
                {!type && (
                  <>
                    <div className="text-[11px] font-display font-semibold text-muted uppercase tracking-wider">Tipo de evento</div>
                    <div className="grid grid-cols-3 gap-2">
                      {INCIDENT_TYPE_KEYS.map(k => {
                        const t = SCI_INCIDENT_TYPES[k]
                        return (
                          <button
                            key={k}
                            onClick={() => pickType(k)}
                            className="flex flex-col items-center gap-1 p-3 bg-bg border border-surface-3 rounded-lg hover:border-accent hover:bg-surface-2 transition-colors"
                          >
                            <SciIcon type="incident" code={k} size={22} />
                            <span className="text-[10px] text-foreground text-center leading-tight">{t.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}

                {type && typeDef && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <SciIcon type="incident" code={type} size={18} />
                        <span className="text-sm font-display font-semibold text-foreground">{typeDef.label}</span>
                      </div>
                      <button onClick={() => setType(null)} className="text-[10px] text-muted hover:text-foreground">Cambiar tipo</button>
                    </div>

                    <div>
                      <label className="text-[10px] font-display font-semibold text-muted uppercase tracking-wider">Clave del incidente *</label>
                      <input
                        value={clave}
                        onChange={e => setClave(e.target.value)}
                        className="mt-1 w-full px-2 py-1.5 bg-bg border border-surface-3 rounded text-xs text-foreground font-mono"
                        placeholder="SCI-2026-0001"
                      />
                    </div>

                    {typeDef.fields.map(f => (
                      <div key={f.name}>
                        <label className="text-[10px] font-display font-semibold text-muted uppercase tracking-wider">
                          {f.label}
                        </label>
                        {f.type === 'range' && (
                          <div className="flex items-center gap-2 mt-1">
                            <input
                              type="range"
                              min={f.min} max={f.max} step={f.step}
                              value={fields[f.name]}
                              onChange={e => setFields(s => ({ ...s, [f.name]: Number(e.target.value) }))}
                              className="flex-1 accent-accent"
                            />
                            <span className="text-xs font-mono text-accent w-12 text-right">{fields[f.name]}</span>
                          </div>
                        )}
                        {f.type === 'number' && (
                          <input
                            type="number"
                            min={f.min} max={f.max} step={f.step}
                            value={fields[f.name] ?? ''}
                            onChange={e => setFields(s => ({ ...s, [f.name]: Number(e.target.value) }))}
                            className="mt-1 w-full px-2 py-1.5 bg-bg border border-surface-3 rounded text-xs text-foreground font-mono"
                          />
                        )}
                        {f.type === 'select' && (
                          <select
                            value={fields[f.name] ?? ''}
                            onChange={e => setFields(s => ({ ...s, [f.name]: e.target.value }))}
                            className="mt-1 w-full px-2 py-1.5 bg-bg border border-surface-3 rounded text-xs text-foreground"
                          >
                            {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        )}
                        {f.type === 'textarea' && (
                          <textarea
                            value={fields[f.name] ?? ''}
                            onChange={e => setFields(s => ({ ...s, [f.name]: e.target.value }))}
                            rows={2}
                            className="mt-1 w-full px-2 py-1.5 bg-bg border border-surface-3 rounded text-xs text-foreground resize-none"
                          />
                        )}
                        {f.hint && <div className="text-[9px] text-muted mt-0.5">{f.hint}</div>}
                      </div>
                    ))}
                  </>
                )}
              </>
            )}

            {creation.step === 'zones' && typeDef && (
              <>
                <div className="text-[11px] font-display font-semibold text-muted uppercase tracking-wider">Radios SCI (metros)</div>
                {[
                  { key: 'red',    label: 'Zona caliente (roja)',  color: '#ef4444', max: 5000 },
                  { key: 'yellow', label: 'Zona tibia (amarilla)', color: '#facc15', max: 8000 },
                  { key: 'green',  label: 'Zona fría (verde)',     color: '#22c55e', max: 12000 },
                ].map(z => (
                  <div key={z.key}>
                    <div className="flex items-center justify-between text-[11px]">
                      <span style={{ color: z.color }}>● {z.label}</span>
                      <span className="font-mono text-foreground">{zones[z.key]} m</span>
                    </div>
                    <input
                      type="range"
                      min={20} max={z.max} step={10}
                      value={zones[z.key]}
                      onChange={e => setZones(s => ({ ...s, [z.key]: Number(e.target.value) }))}
                      className="w-full"
                      style={{ accentColor: z.color }}
                    />
                  </div>
                ))}
                <div className="text-[10px] text-muted">
                  La zona caliente debe contener el sitio del evento. Tibia: zona de operaciones controladas. Fría: zona segura para PC, ACV y staging.
                </div>
              </>
            )}
          </div>

          <div className="px-5 py-3 border-t border-surface-3 flex items-center justify-between">
            <button onClick={cancel} className="text-xs text-muted hover:text-foreground">Cancelar</button>
            {creation.step === 'form' && type && (
              <button
                onClick={goToZones}
                className="px-4 py-1.5 bg-accent text-white rounded-md text-xs font-semibold hover:bg-accent-light"
              >Continuar →</button>
            )}
            {creation.step === 'zones' && (
              <div className="flex gap-2">
                <button
                  onClick={() => dispatch({ type: 'SCI_SET_DRAFT_STEP', payload: 'form' })}
                  className="px-3 py-1.5 bg-surface border border-surface-3 rounded-md text-xs text-muted hover:text-foreground"
                >← Atrás</button>
                <button
                  onClick={commit}
                  className="px-4 py-1.5 bg-accent text-white rounded-md text-xs font-semibold hover:bg-accent-light"
                >Crear incidente</button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
