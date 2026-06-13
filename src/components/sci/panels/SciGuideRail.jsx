import { useMemo, useCallback, useState } from 'react'
import { motion } from 'framer-motion' // eslint-disable-line no-unused-vars
import { useAppContext } from '../../../context/AppContext.jsx'
import { SCI_INCIDENT_TYPES } from '../../../constants/sciIncidentTypes.js'
import { CHECKLIST_PHASES } from '../../../constants/sciChecklist.js'
import { resolveChecklist, checklistProgress, nextPendingStep } from '../../../utils/sciChecklistEngine.js'
import { calcEtaMs } from '../../../utils/etaModel.js'
import SciAssignSuggestions from './SciAssignSuggestions.jsx'
import SciIcon from '../SciIcon.jsx'
import {
  Check, Lock, Circle, ArrowRight, ClipboardCheck, ListChecks,
  ChevronRight, Plus, Info, Users, Pencil, CheckCheck,
} from 'lucide-react'

function progressColor(pct) {
  if (pct >= 80) return '#22c55e'
  if (pct >= 45) return '#f59e0b'
  return '#fb923c'
}

// ── Vista genérica: pasos estándar SCI (sin incidente) ──────────────
function GenericGuide({ onCreate, canCreate }) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      <div className="bg-slate-800/40 rounded-xl p-3.5 flex items-start gap-2.5">
        <Info size={18} className="text-sky-400 shrink-0 mt-0.5" strokeWidth={2} />
        <p className="text-[12px] text-slate-300 leading-relaxed">
          Estos son los pasos estándar del protocolo <strong className="text-slate-100">SCI</strong>.
          Cuando registres un incidente, el sistema marcará automáticamente cada paso conforme lo realices.
        </p>
      </div>

      {/* Pasos por fase — referencia */}
      <div className="space-y-3">
        {CHECKLIST_PHASES.map((phase, idx) => (
          <div key={phase.key} className="flex items-start gap-3">
            <div
              className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold mt-0.5"
              style={{ backgroundColor: phase.color + '22', color: phase.color }}
            >
              {idx + 1}
            </div>
            <div>
              <div className="text-[13px] font-semibold text-slate-100">{phase.label}</div>
            </div>
          </div>
        ))}
      </div>

      {canCreate && (
        <button
          onClick={onCreate}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-[13px] font-bold transition-colors"
        >
          <Plus size={17} strokeWidth={2.4} />
          Registrar incidente
        </button>
      )}
    </div>
  )
}

// ── Nota documentable con modo ver / editar ──────────────────────────
function StepNote({ step, incidentId, dispatch }) {
  const [editing, setEditing] = useState(!(step.note))
  const [local, setLocal] = useState(step.note ?? '')
  const [saved, setSaved] = useState(!!step.note)

  // Sync if note changes from outside (e.g. restore)
  const prevKey = `${incidentId}_${step.key}`
  const [lastKey, setLastKey] = useState(prevKey)
  if (lastKey !== prevKey) {
    setLastKey(prevKey)
    setLocal(step.note ?? '')
    setEditing(!step.note)
    setSaved(!!step.note)
  }

  if (!step.notePrompt) return null

  const save = () => {
    const trimmed = local.trim()
    dispatch({ type: 'SCI_CHECKLIST_NOTE', payload: { incidentId, stepKey: step.key, note: trimmed } })
    setEditing(false)
    setSaved(true)
  }

  if (!editing && saved) {
    return (
      <div className="mt-1 bg-slate-900/50 border border-slate-700/30 rounded-lg px-2.5 py-2 flex items-start gap-2">
        <CheckCheck size={11} className="text-emerald-500 shrink-0 mt-0.5" strokeWidth={2} />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-slate-300 leading-snug break-words whitespace-pre-wrap">
            {local || <span className="text-slate-600 italic">(sin nota)</span>}
          </p>
        </div>
        <button
          onClick={() => setEditing(true)}
          title="Editar nota"
          className="shrink-0 text-slate-500 hover:text-slate-200 transition-colors p-0.5 rounded hover:bg-slate-700/50"
        >
          <Pencil size={10} strokeWidth={2} />
        </button>
      </div>
    )
  }

  return (
    <div className="mt-1">
      <textarea
        autoFocus={editing && saved}
        value={local}
        onChange={e => setLocal(e.target.value)}
        placeholder={step.notePrompt}
        rows={2}
        className="w-full px-2 py-1.5 rounded-lg bg-slate-900/70 border border-slate-700/40 text-[10.5px] text-slate-300 placeholder:text-slate-600 resize-none focus:outline-none focus:border-slate-600 leading-relaxed"
      />
      <div className="flex gap-1.5 mt-1">
        <button
          onClick={save}
          className="flex-1 flex items-center justify-center gap-1 py-1 rounded bg-emerald-700/60 hover:bg-emerald-600/70 text-emerald-200 text-[9.5px] font-semibold transition-colors"
        >
          <CheckCheck size={10} strokeWidth={2.4} /> Guardar nota
        </button>
        {saved && (
          <button
            onClick={() => { setLocal(step.note ?? ''); setEditing(false) }}
            className="px-2 py-1 rounded bg-slate-700/50 hover:bg-slate-700 text-slate-400 text-[9.5px] transition-colors"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  )
}

export default function SciGuideRail({ onOpenDetail, onCreateIncident, onShowResources }) {
  const { state, dispatch } = useAppContext()
  const { sci } = state

  // Incidente "actual" = seleccionado, o el primer activo
  const current = useMemo(() => {
    if (sci.selectedIncidentId != null) {
      return sci.incidents.find(i => i.id === sci.selectedIncidentId) ?? null
    }
    return sci.incidents.find(i => i.status === 'active') ?? null
  }, [sci.selectedIncidentId, sci.incidents])

  const activeList = useMemo(() => sci.incidents.filter(i => i.status === 'active'), [sci.incidents])

  const resolved = useMemo(() => current ? resolveChecklist(current, sci) : [], [current, sci])
  const progress = useMemo(() => checklistProgress(resolved), [resolved])
  const next = useMemo(() => nextPendingStep(resolved), [resolved])

  const availableUnits = useMemo(() =>
    sci.resources.allIds.map(id => sci.resources.byId[id]).filter(r => r && r.state === 'disponible' && r.mobile),
    [sci.resources],
  )

  const canCreate = sci.mode !== 'auto'

  const handleAssign = useCallback((resourceId) => {
    if (!current) return
    const r = sci.resources.byId[resourceId]
    if (!r) return
    const eta = calcEtaMs({
      originLat: r.lat, originLng: r.lng,
      destLat: current.lat, destLng: current.lng,
      typeCode: r.typeCode, emergency: true,
    })
    dispatch({ type: 'SCI_ASSIGN_RESOURCE', payload: {
      resourceId, incidentId: current.id,
      waypoints: [[r.lat, r.lng], [current.lat, current.lng]], eta,
    }})
  }, [current, sci.resources, dispatch])

  const toggleStep = useCallback((stepKey, source) => {
    // Lock ONLY auto-detected completed steps — pending steps always toggleable
    if ((source === 'auto') || !current) return
    dispatch({ type: 'SCI_CHECKLIST_TOGGLE', payload: { incidentId: current.id, stepKey } })
  }, [current, dispatch])

  const typeDef = current ? SCI_INCIDENT_TYPES[current.type] : null
  const col = progressColor(progress.pct)

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute right-2 z-[800] flex flex-col bg-[#0c1520]/95 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-xl overflow-hidden"
      style={{ top: '6.5rem', bottom: '1rem', width: '20rem' }}
    >
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-slate-700/50 bg-slate-900/40 flex items-center gap-2">
        <ListChecks size={17} className="text-slate-300 shrink-0" strokeWidth={2} />
        <span className="text-[13px] font-bold text-slate-100">Guía SCI</span>
        {current && (
          <span className="ml-auto font-mono text-[11px] font-bold text-slate-300">{current.clave}</span>
        )}
      </div>

      {!current ? (
        <GenericGuide onCreate={onCreateIncident} canCreate={canCreate} />
      ) : (
        <>
          {/* Selector de incidente (si hay varios activos) */}
          {activeList.length > 1 && (
            <div className="shrink-0 px-3 py-2 border-b border-slate-700/40 flex gap-1.5 overflow-x-auto">
              {activeList.map(inc => (
                <button
                  key={inc.id}
                  onClick={() => dispatch({ type: 'SCI_SELECT_INCIDENT', payload: inc.id })}
                  className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold transition-colors ${
                    current.id === inc.id
                      ? 'bg-slate-700 text-slate-100'
                      : 'bg-slate-800/60 text-slate-500 hover:text-slate-300'
                  }`}
                >{inc.clave}</button>
              ))}
            </div>
          )}

          {/* Resumen del incidente */}
          <div className="shrink-0 px-4 py-3 border-b border-slate-700/40 flex items-center gap-3">
            <div className="shrink-0 w-10 h-10 rounded-lg bg-slate-800/60 flex items-center justify-center">
              <SciIcon type="incident" code={current.type} size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-slate-100 leading-tight">{typeDef?.label}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {current.assignedUnitIds?.length ?? 0} unidades
                {(current.fields?.victimas ?? current.fields?.atrapados) > 0 &&
                  ` · ${current.fields?.victimas ?? current.fields?.atrapados} víctimas`}
              </div>
            </div>
            <button
              onClick={onOpenDetail}
              title="Ver detalles del incidente"
              className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-colors"
            >
              Detalles <ChevronRight size={13} />
            </button>
          </div>

          {/* Cuerpo scroll: checklist */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">

            {/* CHECKLIST — protagonista */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ClipboardCheck size={15} style={{ color: col }} strokeWidth={2} />
                <span className="text-[12px] font-bold text-slate-200">Pasos del protocolo</span>
                <span className="ml-auto text-[12px] font-mono font-bold" style={{ color: col }}>
                  {progress.done}/{progress.total}
                </span>
              </div>

              {/* Barra de progreso */}
              <div className="h-2 rounded-full bg-slate-700/50 overflow-hidden mb-2">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: col }}
                  initial={false}
                  animate={{ width: `${progress.pct}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>

              {/* Próxima acción destacada */}
              {next && (
                <div className="flex items-start gap-2 mb-3 px-3 py-2 rounded-lg bg-amber-950/30 border border-amber-800/30">
                  <ArrowRight size={15} className="shrink-0 mt-0.5" style={{ color: col }} strokeWidth={2.4} />
                  <div className="min-w-0">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-amber-500/80">Siguiente paso</div>
                    <div className="text-[13px] text-slate-100 font-semibold leading-tight">{next.label}</div>
                    <div className="text-[11px] text-slate-400 leading-snug mt-0.5">{next.hint}</div>
                  </div>
                </div>
              )}

              {/* Pasos por fase */}
              <div className="space-y-3">
                {CHECKLIST_PHASES.map(phase => {
                  const steps = resolved.filter(s => s.phase === phase.key && s.applicable)
                  if (steps.length === 0) return null
                  const ph = progress.byPhase[phase.key]
                  const isRecursos = phase.key === 'recursos'

                  return (
                    <div key={phase.key}>
                      {/* Encabezado de fase */}
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: phase.color }} />
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: phase.color }}>
                          {phase.label}
                        </span>
                        <span className="text-[9px] font-mono text-slate-600 ml-auto">{ph.done}/{ph.total}</span>
                        {/* Botón Ver unidades — solo en fase Recursos */}
                        {isRecursos && onShowResources && (
                          <button
                            onClick={onShowResources}
                            title="Abrir panel de unidades disponibles"
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-orange-900/30 hover:bg-orange-800/40 text-orange-400 hover:text-orange-300 text-[9px] font-semibold transition-colors border border-orange-800/30"
                          >
                            <Users size={10} strokeWidth={2} />
                            Ver unidades
                          </button>
                        )}
                      </div>

                      {/* IA Sugerencias — justo ANTES de los pasos de recursos */}
                      {isRecursos && current.status !== 'closed' && availableUnits.length > 0 && (
                        <div className="mb-2">
                          <SciAssignSuggestions
                            incident={current}
                            availableUnits={availableUnits}
                            onAssign={handleAssign}
                            simRunning={sci.mode === 'auto' && sci.running}
                          />
                        </div>
                      )}

                      {/* Pasos de la fase */}
                      <div className="space-y-0.5">
                        {steps.map(step => {
                          // Bloquear SOLO pasos que el sistema ya detectó como cumplidos
                          const isLocked = step.source === 'auto' && step.done
                          const isNext = next?.key === step.key

                          return (
                            <div key={step.key} className="flex flex-col">
                              <button
                                onClick={() => !isLocked && toggleStep(step.key, step.source)}
                                className={`w-full flex items-start gap-2.5 px-2 py-2 rounded-lg text-left transition-colors ${
                                  isLocked ? 'cursor-default opacity-70' : 'hover:bg-slate-800/60 active:bg-slate-700/60 cursor-pointer'
                                } ${isNext ? 'bg-slate-800/40 ring-1 ring-amber-700/30' : ''}`}
                              >
                                <span className="shrink-0 mt-0.5">
                                  {step.done ? (
                                    <span className="w-5 h-5 rounded-md flex items-center justify-center" style={{ backgroundColor: phase.color }}>
                                      <Check size={13} className="text-slate-900" strokeWidth={3.5} />
                                    </span>
                                  ) : (
                                    <span className="w-5 h-5 rounded-md border-2 border-slate-600 flex items-center justify-center">
                                      <Circle size={5} className="text-slate-700" fill="currentColor" />
                                    </span>
                                  )}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`text-[12.5px] leading-tight ${step.done ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
                                      {step.label}
                                    </span>
                                    {isLocked && (
                                      <Lock size={10} className="text-slate-600 shrink-0" title="Verificado automáticamente por el sistema" />
                                    )}
                                  </div>
                                </div>
                              </button>

                              {/* Nota documentable — siempre visible si el paso tiene notePrompt */}
                              {step.notePrompt && (
                                <div className="px-2 pb-1.5">
                                  <StepNote step={step} incidentId={current.id} dispatch={dispatch} />
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  )
}
