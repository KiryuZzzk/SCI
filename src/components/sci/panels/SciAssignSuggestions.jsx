import { useMemo, useState } from 'react'
import { Sparkles, Zap, ChevronDown, AlertTriangle, PackageCheck } from 'lucide-react'
import SciIcon from '../SciIcon.jsx'
import { rankUnits, recommendPackage } from '../../../utils/sciDecisionEngine.js'
import { capLabel } from '../../../constants/sciCapabilityMatrix.js'
import { fmtEta } from '../../../utils/etaModel.js'
import { SCI_DEPENDENCIES } from '../../../constants/sciDependencies.js'

function scoreColor(score) {
  if (score >= 70) return '#22c55e'
  if (score >= 45) return '#f59e0b'
  return '#94a3b8'
}

/**
 * Panel de recomendación de despacho (motor de decisión).
 * Muestra paquete recomendado + top unidades individuales con score.
 *
 * Props:
 *   simRunning — true cuando la simulación automática está activa.
 *                En ese modo las asignaciones son automáticas; se muestra aviso.
 */
export default function SciAssignSuggestions({ incident, availableUnits, onAssign, simRunning = false }) {
  const [expanded, setExpanded] = useState(true)
  // Estabilizar la referencia del incidente: solo re-rankear si cambia id, tipo o posición
  const incidentKey = `${incident?.id}-${incident?.type}-${incident?.lat?.toFixed(4)}-${incident?.lng?.toFixed(4)}`

  // Recompute solo cuando cambia la clave estable del incidente o el conjunto de disponibles
  const { ranked, pkg } = useMemo(() => {
    const r = rankUnits(incident, availableUnits)
    const p = recommendPackage(incident, availableUnits)
    return { ranked: r, pkg: p }
  }, [incidentKey, availableUnits.length]) // eslint-disable-line react-hooks/exhaustive-deps

  if (availableUnits.length === 0) return null
  if (ranked.length === 0) return null

  const topIndividual = ranked.slice(0, 4)
  // Capture IDs at click time — prevents race condition if state changes mid-dispatch
  const dispatchPackage = () => {
    const ids = pkg.package.map(s => s.resourceId)
    ids.forEach(id => onAssign(id))
  }

  return (
    <div className="bg-gradient-to-b from-violet-950/30 to-slate-900/20 border border-violet-800/30 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-violet-900/20 transition-colors"
      >
        <Sparkles size={13} className="text-violet-400 shrink-0" strokeWidth={2} />
        <span className="text-[10px] font-bold text-violet-300 uppercase tracking-wider flex-1 text-left">
          Recomendación de despacho
        </span>
        <ChevronDown size={13} className={`text-violet-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Aviso: simulación activa — asignaciones automáticas */}
      {simRunning && (
        <div className="px-2.5 pb-2 text-[9.5px] text-amber-400/80 bg-amber-950/20 border-t border-amber-800/20 py-1.5 flex items-center gap-1.5">
          <AlertTriangle size={10} className="shrink-0" strokeWidth={2} />
          Simulación activa — asignaciones automáticas en curso
        </div>
      )}

      {expanded && (
        <div className="px-2.5 pb-2.5 space-y-2.5">
          {/* Paquete recomendado */}
          {pkg.package.length > 0 && (
            <div className="bg-slate-900/50 rounded-lg p-2 border border-violet-800/20">
              <div className="flex items-center gap-1.5 mb-1.5">
                <PackageCheck size={11} className="text-violet-400" strokeWidth={2} />
                <span className="text-[9px] font-semibold text-slate-300 uppercase tracking-wider">
                  Paquete sugerido · {pkg.package.length} unid.
                </span>
              </div>
              <div className="space-y-1 mb-2">
                {pkg.package.map(s => {
                  return (
                    <div key={s.resourceId} className="flex items-center gap-1.5 text-[10px]">
                      <SciIcon type="dep" code={s.resource.dependency} size={11} className="shrink-0" />
                      <span className="text-slate-300 flex-1 truncate">{s.resource.label}</span>
                      <span className="text-amber-400 font-mono text-[9px] shrink-0">{fmtEta(s.eta)}</span>
                    </div>
                  )
                })}
              </div>
              {pkg.uncovered.length > 0 && (
                <div className="flex items-start gap-1 mb-2 text-[8.5px] text-amber-500/90">
                  <AlertTriangle size={10} className="shrink-0 mt-0.5" strokeWidth={2} />
                  <span>Sin cubrir: {pkg.uncovered.map(capLabel).join(', ')}</span>
                </div>
              )}
              <button
                onClick={dispatchPackage}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold bg-violet-600/90 hover:bg-violet-500 text-white transition-colors"
              >
                <Zap size={11} strokeWidth={2.4} />
                Despachar paquete completo
              </button>
            </div>
          )}

          {/* Top unidades individuales */}
          <div className="space-y-1">
            <div className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider px-0.5">
              Mejores unidades
            </div>
            {topIndividual.map((s, i) => {
              const dep = SCI_DEPENDENCIES[s.resource.dependency]
              const col = scoreColor(s.score)
              return (
                <button
                  key={s.resourceId}
                  onClick={() => onAssign(s.resourceId)}
                  className="w-full bg-slate-800/40 hover:bg-slate-800/70 rounded-lg p-2 transition-colors text-left group"
                >
                  <div className="flex items-center gap-2">
                    {/* rank */}
                    <span className="shrink-0 w-4 text-center text-[10px] font-mono font-bold text-slate-600">
                      {i + 1}
                    </span>
                    <SciIcon type="dep" code={s.resource.dependency} size={13} className="shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10.5px] text-slate-200 font-medium truncate">{s.resource.label}</div>
                      <div className="text-[8.5px] text-slate-500">{dep?.label}</div>
                    </div>
                    {/* compatibilidad + ETA */}
                    <div className="shrink-0 text-right">
                      <div className="text-[11px] font-bold font-mono leading-none" style={{ color: col }}>
                        {s.score}<span className="text-[7px] font-normal text-slate-500">/100</span>
                      </div>
                      <div className="text-[7.5px] text-slate-500 mt-0.5">compatib.</div>
                      <div className="text-[8px] text-amber-400 font-mono mt-0.5">{fmtEta(s.eta)}</div>
                    </div>
                  </div>
                  {/* matched capabilities */}
                  {s.matched.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5 pl-6">
                      {s.matched.slice(0, 4).map(c => (
                        <span key={c} className="text-[8px] px-1 py-0.5 rounded bg-violet-900/40 text-violet-300 border border-violet-800/30">
                          {capLabel(c)}
                        </span>
                      ))}
                    </div>
                  )}
                  {/* score bar */}
                  <div className="mt-1.5 ml-6 h-1 rounded-full bg-slate-700/50 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${s.score}%`, backgroundColor: col }} />
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
