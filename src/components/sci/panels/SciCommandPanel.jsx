import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppContext } from '../../../context/AppContext.jsx'
import { ICS_ROLES, ICS_ROLE_KEYS } from '../../../constants/icsRoles.js'
import { MOCK_PERSONNEL } from '../../../constants/icsMockPersonnel.js'
import { nextOpId } from '../../../utils/idGen.js'

const LEVEL_COLORS = {
  1: 'text-red-300 border-red-800/40',
  2: 'text-amber-300 border-amber-800/40',
  3: 'text-slate-300 border-slate-700/40',
}

export default function SciCommandPanel() {
  const { state, dispatch } = useAppContext()
  const { command, operationalPeriods, activeOpId } = state.sci
  const [open, setOpen] = useState(false)
  const [openRole, setOpenRole] = useState(null)

  const activeOp = operationalPeriods.find(op => op.id === activeOpId)

  const handleAssign = (role, personnelId) => {
    dispatch({ type: 'SCI_ASSIGN_ROLE', payload: { role, personnelId } })
    setOpenRole(null)
  }

  const handleOpenOp = () => {
    dispatch({ type: 'SCI_OPEN_OP', payload: { nextOpId: nextOpId() } })
  }

  const handleCloseOp = () => {
    if (activeOpId) dispatch({ type: 'SCI_CLOSE_OP', payload: { id: activeOpId } })
  }

  const icId = command.IC?.personnelId
  const icName = icId ? MOCK_PERSONNEL.find(p => p.id === icId)?.name : null

  return (
    <div className="shrink-0 border-b border-slate-700/40">
      {/* Header toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-slate-800/30 transition-colors"
      >
        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">ICS Mando</span>
        {icName && (
          <span className="text-[9px] text-amber-300 font-mono truncate flex-1 text-left">{icName}</span>
        )}
        {activeOp && (
          <span className="text-[8px] font-mono text-slate-500 shrink-0">{activeOp.label}</span>
        )}
        <span className="text-[8px] text-slate-600 shrink-0">{open ? '▲' : '▼'}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-2 space-y-1">
              {/* OP controls */}
              <div className="flex items-center gap-1.5 mb-2 pt-1">
                <span className="text-[9px] text-slate-500">OP:</span>
                {activeOp ? (
                  <>
                    <span className="text-[9px] font-mono text-amber-300">{activeOp.label}</span>
                    <button
                      onClick={handleCloseOp}
                      className="ml-auto text-[8px] text-slate-500 hover:text-red-400 transition-colors"
                    >Cerrar OP</button>
                  </>
                ) : (
                  <button
                    onClick={handleOpenOp}
                    className="text-[9px] text-slate-400 hover:text-slate-200 transition-colors"
                  >+ Abrir OP</button>
                )}
              </div>

              {/* Roles grid */}
              {ICS_ROLE_KEYS.map(roleKey => {
                const role   = ICS_ROLES[roleKey]
                const assign = command[roleKey]
                const person = assign ? MOCK_PERSONNEL.find(p => p.id === assign.personnelId) : null
                const lc     = LEVEL_COLORS[role.level] ?? LEVEL_COLORS[3]

                return (
                  <div key={roleKey} className="relative">
                    <button
                      onClick={() => setOpenRole(r => r === roleKey ? null : roleKey)}
                      className={`w-full flex items-center gap-2 px-2 py-1 rounded border ${lc} bg-slate-900/40 hover:bg-slate-800/50 transition-colors`}
                    >
                      <span className={`text-[9px] font-mono font-bold w-8 shrink-0 ${lc.split(' ')[0]}`}>
                        {role.short}
                      </span>
                      <span className="text-[9px] text-slate-400 flex-1 truncate text-left">
                        {person ? person.name : '— sin asignar'}
                      </span>
                      {assign && (
                        <button
                          onClick={e => { e.stopPropagation(); dispatch({ type: 'SCI_UNASSIGN_ROLE', payload: { role: roleKey } }) }}
                          className="text-[8px] text-slate-600 hover:text-red-400 transition-colors shrink-0"
                        >✕</button>
                      )}
                    </button>

                    <AnimatePresence>
                      {openRole === roleKey && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="absolute left-0 right-0 z-50 mt-0.5 bg-[#080f18] border border-slate-700/50 rounded-lg shadow-xl max-h-48 overflow-y-auto"
                        >
                          {MOCK_PERSONNEL.map(p => (
                            <button
                              key={p.id}
                              onClick={() => handleAssign(roleKey, p.id)}
                              className="w-full text-left px-2.5 py-1.5 hover:bg-slate-800/60 transition-colors"
                            >
                              <div className="text-[9px] text-slate-200">{p.name}</div>
                              <div className="text-[8px] text-slate-500">{p.rank} · {p.org}</div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
