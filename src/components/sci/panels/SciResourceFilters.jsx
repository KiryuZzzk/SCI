import { useAppContext } from '../../../context/AppContext.jsx'
import { SCI_DEPENDENCIES, DEPENDENCY_KEYS } from '../../../constants/sciDependencies.js'
import SciIcon from '../SciIcon.jsx'

const STATES = ['all', 'disponible', 'asignado', 'no-disponible']
const STATE_LABELS = {
  all: 'Todos',
  disponible: 'Disponible',
  asignado: 'Asignado',
  'no-disponible': 'No disponible',
}

export default function SciResourceFilters() {
  const { state, dispatch } = useAppContext()
  const f = state.sci.uiFilters

  const set = (patch) => dispatch({ type: 'SCI_SET_FILTERS', payload: patch })

  return (
    <div className="space-y-3 p-3 border-b border-surface-3">
      <div>
        <label className="text-[10px] font-display font-semibold text-muted uppercase tracking-wider">Dependencia</label>
        <div className="flex flex-wrap gap-1 mt-1">
          <button
            onClick={() => set({ dependency: 'all' })}
            className={`px-2 py-0.5 text-xs rounded ${f.dependency === 'all' ? 'bg-surface-3 text-foreground' : 'bg-surface text-muted hover:text-foreground'}`}
          >Todas</button>
          {DEPENDENCY_KEYS.map(k => {
            const dep = SCI_DEPENDENCIES[k]
            const active = f.dependency === k
            return (
              <button
                key={k}
                onClick={() => set({ dependency: k })}
                className={`px-2 py-0.5 text-xs rounded flex items-center gap-1 ${
                  active ? 'text-white' : 'bg-surface text-muted hover:text-foreground'
                }`}
                style={active ? { backgroundColor: dep.color } : undefined}
              >
                <SciIcon type="dep" code={k} size={11} color={active ? '#0f172a' : dep.color} />{dep.label}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label className="text-[10px] font-display font-semibold text-muted uppercase tracking-wider">Estado</label>
        <div className="flex gap-1 mt-1">
          {STATES.map(s => (
            <button
              key={s}
              onClick={() => set({ state: s })}
              className={`px-2 py-0.5 text-xs rounded ${f.state === s ? 'bg-surface-3 text-foreground' : 'bg-surface text-muted hover:text-foreground'}`}
            >{STATE_LABELS[s]}</button>
          ))}
        </div>
      </div>
    </div>
  )
}
