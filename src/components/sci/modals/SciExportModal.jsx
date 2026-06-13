import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppContext } from '../../../context/AppContext.jsx'
import { exportLog, filterLog } from '../../../utils/exportLog.js'
import { Table2, FileText, Braces, FileCode, AlignLeft } from 'lucide-react'

const FORMATS = [
  { key: 'csv',  Icon: Table2,    label: 'CSV',      desc: 'Excel · análisis post-evento' },
  { key: 'pdf',  Icon: FileText,  label: 'PDF',      desc: 'ICS-214 oficial · handoff formal' },
  { key: 'json', Icon: Braces,    label: 'JSON',     desc: 'Interop · archivo · forense' },
  { key: 'md',   Icon: FileCode,  label: 'Markdown', desc: 'Notas modernas · GitHub · Slack' },
  { key: 'txt',  Icon: AlignLeft, label: 'Texto',    desc: 'Radio · WhatsApp · resumen rápido' },
]

const SCOPES = [
  { key: 'all',      label: 'Todo el registro' },
  { key: 'critical', label: 'Solo críticos' },
  { key: 'op',       label: 'OP actual' },
]

export default function SciExportModal({ open, onClose }) {
  const { state } = useAppContext()
  const { sci } = state
  const [format, setFormat] = useState('csv')
  const [scope,  setScope]  = useState('all')

  const entries  = sci.eventLog ?? []
  const activeOp = sci.operationalPeriods?.find(op => op.id === sci.activeOpId)
  const scopeArg = scope === 'op' ? sci.activeOpId : undefined
  const preview  = filterLog(entries, scope, scopeArg).length

  const handleExport = () => {
    exportLog({ entries, sci, scope, scopeArg, format })
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1200] overflow-y-auto bg-black/75 backdrop-blur-sm"
          onClick={onClose}
        >
          <div className="flex min-h-full items-center justify-center p-6">
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 10, opacity: 0, scale: 0.97 }}
            className="bg-[#080f18] border border-slate-700/50 rounded-2xl shadow-2xl w-[460px]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-slate-700/50 flex items-center justify-between bg-slate-900/40 rounded-t-2xl">
              <div>
                <div className="text-[12px] font-bold text-slate-100">Exportar registro</div>
                <div className="text-[9px] text-slate-500 mt-0.5">
                  ICS-214 · CSV · JSON · Markdown · Texto plano
                </div>
              </div>
              <button onClick={onClose} className="text-slate-500 hover:text-slate-200 text-xl leading-none">×</button>
            </div>

            <div className="p-4 space-y-4">
              {/* Formato */}
              <div>
                <div className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Formato</div>
                <div className="grid grid-cols-5 gap-1.5">
                  {FORMATS.map(f => (
                    <button
                      key={f.key}
                      onClick={() => setFormat(f.key)}
                      className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-lg border transition-all ${
                        format === f.key
                          ? 'bg-slate-700/80 border-slate-500 text-slate-100'
                          : 'bg-slate-900/60 border-slate-700/40 text-slate-500 hover:border-slate-600 hover:text-slate-300'
                      }`}
                    >
                      <f.Icon size={16} strokeWidth={1.75} />
                      <span className="text-[9px] font-bold">{f.label}</span>
                    </button>
                  ))}
                </div>
                {/* Desc del formato seleccionado */}
                <div className="mt-1.5 text-[9px] text-slate-500 text-center">
                  {FORMATS.find(f => f.key === format)?.desc}
                </div>
              </div>

              {/* Alcance */}
              <div>
                <div className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Alcance</div>
                <div className="flex gap-1.5">
                  {SCOPES.map(s => {
                    const disabled = s.key === 'op' && !activeOp
                    return (
                      <button
                        key={s.key}
                        disabled={disabled}
                        onClick={() => !disabled && setScope(s.key)}
                        className={`flex-1 py-1.5 text-[10px] font-medium rounded-lg border transition-all ${
                          scope === s.key
                            ? 'bg-slate-700/80 border-slate-500 text-slate-100'
                            : disabled
                              ? 'bg-slate-900/40 border-slate-800/40 text-slate-700 cursor-not-allowed'
                              : 'bg-slate-900/60 border-slate-700/40 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                        }`}
                      >
                        {s.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Preview */}
              <div className="bg-slate-800/50 rounded-lg px-3 py-2 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Entradas a exportar</span>
                <span className={`text-[13px] font-mono font-bold ${preview > 0 ? 'text-slate-100' : 'text-slate-600'}`}>
                  {preview}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-700/40 flex items-center justify-between bg-slate-900/30 rounded-b-2xl">
              <button onClick={onClose} className="text-[10px] text-slate-500 hover:text-slate-300">Cancelar</button>
              <button
                onClick={handleExport}
                disabled={preview === 0}
                className={`px-4 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                  preview > 0
                    ? 'bg-slate-700 hover:bg-slate-600 text-slate-100'
                    : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                }`}
              >
                ↓ Descargar {FORMATS.find(f => f.key === format)?.label}
              </button>
            </div>
          </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
