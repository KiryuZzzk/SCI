import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppContext } from '../../../context/AppContext.jsx'
import { MOCK_PERSONNEL } from '../../../constants/icsMockPersonnel.js'
import { downloadICS201 } from '../../../utils/icsForms/ics201.js'
import { downloadICS209 } from '../../../utils/icsForms/ics209.js'
import { downloadICS211 } from '../../../utils/icsForms/ics211.js'
import { downloadICS214 } from '../../../utils/icsForms/ics214.js'
import { downloadAAR } from '../../../utils/icsForms/aar.js'

const FORMS = [
  {
    id: 'ICS-201',
    label: 'ICS-201',
    sub: 'Briefing del Incidente',
    desc: 'Resumen situacional, organización de mando y recursos desplegados.',
    badge: 'Todos',
    fn: downloadICS201,
  },
  {
    id: 'ICS-209',
    label: 'ICS-209',
    sub: 'Informe de Estado',
    desc: 'Métricas de recursos por dependencia, eventos críticos y estado operacional.',
    badge: 'Todos',
    fn: downloadICS209,
  },
  {
    id: 'ICS-211',
    label: 'ICS-211',
    sub: 'Lista de Check-In',
    desc: 'Registro tabular de todos los recursos: estado, asignación, ETA y check-in.',
    badge: 'Todos',
    fn: downloadICS211,
  },
  {
    id: 'ICS-214',
    label: 'ICS-214',
    sub: 'Registro de Actividades',
    desc: 'Log de actividades de la unidad con personal asignado y bitácora filtrada.',
    badge: 'Por incidente',
    fn: downloadICS214,
  },
  {
    id: 'AAR',
    label: 'AAR',
    sub: 'Informe Post-Operación',
    desc: 'Análisis post-evento: KPIs, participación por dependencia, hallazgos y lecciones aprendidas.',
    badge: 'Operación',
    fn: downloadAAR,
  },
]

// Map personnel array → lookup object
const personnelById = MOCK_PERSONNEL.reduce((acc, p) => { acc[p.id] = p; return acc }, {})

export default function SciFormsModal({ open, onClose, preselectedIncidentId = null }) {
  const { state } = useAppContext()
  const { sci } = state

  const [selectedIncidentId, setSelectedIncidentId] = useState(preselectedIncidentId)
  const [generating, setGenerating] = useState(null)  // form id currently generating
  const [done, setDone] = useState(null)              // last generated form id

  if (!open) return null

  const incident  = selectedIncidentId
    ? sci.incidents.find(i => i.id === selectedIncidentId) ?? null
    : sci.incidents[0] ?? null

  const activeOp  = sci.operationalPeriods.find(op => op.id === sci.activeOpId) ?? null
  const resources = sci.resources.allIds.map(id => sci.resources.byId[id]).filter(Boolean)
  const log       = sci.eventLog ?? []
  const scenario  = sci.autoTimeline?.name ?? null

  const handleGenerate = async (form) => {
    setGenerating(form.id)
    setDone(null)
    try {
      form.fn({
        incident,
        command: sci.command,
        op: activeOp,
        resources,
        log,
        personnelById,
        scenario,
        sci,
      })
      setDone(form.id)
    } catch (err) {
      console.error(`[ICS Forms] Error generando ${form.id}:`, err)
      alert(`Error generando ${form.id}:\n${err.message ?? err}`)
    } finally {
      setGenerating(null)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1100] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Scroll container */}
          <div className="fixed inset-0 z-[1200] overflow-y-auto" onClick={onClose}>
            <div className="flex min-h-full items-center justify-center p-6">
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            className="bg-[#0c1520]/98 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl w-[28rem]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between rounded-t-2xl">
              <div>
                <div className="text-[13px] font-bold text-slate-100 tracking-wide">Formatos ICS</div>
                <div className="text-[10px] text-slate-500 mt-0.5">NIMS/ICS · SINAPROC · PC-CDMX</div>
              </div>
              <button
                onClick={onClose}
                className="text-slate-500 hover:text-slate-200 text-xl leading-none"
              >×</button>
            </div>

            {/* Incident selector */}
            <div className="px-5 py-3 border-b border-slate-700/30 bg-slate-900/40">
              <div className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                Incidente de referencia
              </div>
              {sci.incidents.length === 0 ? (
                <p className="text-[10px] text-slate-600 italic">Sin incidentes activos</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {sci.incidents.slice(0, 8).map(inc => (
                    <button
                      key={inc.id}
                      onClick={() => setSelectedIncidentId(inc.id)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                        (selectedIncidentId ?? sci.incidents[0]?.id) === inc.id
                          ? 'bg-orange-500/20 border-orange-600/60 text-orange-300'
                          : 'bg-slate-800/60 border-slate-700/40 text-slate-400 hover:text-slate-200'
                      }`}
                    >{inc.clave}</button>
                  ))}
                </div>
              )}
              {incident && (
                <div className="mt-1.5 text-[9px] text-slate-600 font-mono">
                  {incident.id} · OP: {activeOp?.label ?? '—'}
                </div>
              )}
            </div>

            {/* Forms list */}
            <div className="px-5 py-4 space-y-2.5">
              {FORMS.map(form => {
                const isGen = generating === form.id
                const isDone = done === form.id
                const needsIncident = form.badge === 'Por incidente'

                return (
                  <div
                    key={form.id}
                    className="flex items-start gap-3 bg-slate-800/40 rounded-xl px-3.5 py-3 border border-slate-700/30 hover:border-slate-600/50 transition-colors"
                  >
                    {/* Form badge */}
                    <div className="shrink-0 mt-0.5">
                      <div className="text-[11px] font-bold font-mono text-orange-400 bg-orange-500/10 border border-orange-600/30 rounded px-1.5 py-0.5">
                        {form.label}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[11px] font-semibold text-slate-200">{form.sub}</span>
                        <span className="text-[8px] text-slate-600 bg-slate-800 px-1 rounded border border-slate-700/40">
                          {form.badge}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-500 leading-snug">{form.desc}</p>
                    </div>

                    {/* Download button */}
                    <button
                      onClick={() => handleGenerate(form)}
                      disabled={isGen || (needsIncident && !incident)}
                      title={needsIncident && !incident ? 'Selecciona un incidente primero' : ''}
                      className={`shrink-0 mt-0.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${
                        isDone
                          ? 'bg-emerald-900/40 border-emerald-700/50 text-emerald-400'
                          : isGen
                            ? 'bg-slate-800/60 border-slate-600/40 text-slate-500 cursor-wait'
                            : needsIncident && !incident
                              ? 'bg-slate-800/30 border-slate-700/20 text-slate-700 cursor-not-allowed'
                              : 'bg-slate-700/60 border-slate-600/50 text-slate-300 hover:bg-slate-600/60 hover:text-slate-100'
                      }`}
                    >
                      {isDone ? '✓ Listo' : isGen ? '…' : '↓ PDF'}
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-700/30 flex items-center justify-between rounded-b-2xl">
              <p className="text-[9px] text-slate-600">
                PDFs generados localmente · sin conexión
              </p>
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg text-[11px] bg-slate-800 border border-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors"
              >Cerrar</button>
            </div>
          </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
