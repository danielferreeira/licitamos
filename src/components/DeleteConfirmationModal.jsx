import { Trash2 } from 'lucide-react'

export function DeleteConfirmationModal({ isOpen, onClose, onConfirm, title, description }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center transform transition-all scale-100">
        
        {/* Ícone de Lixeira */}
        <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 size={28} strokeWidth={2} />
        </div>

        {/* Títulos */}
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
          {title || "Excluir Item?"}
        </h3>
        
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
          {description || "Você tem certeza que deseja remover este item? Esta ação não pode ser desfeita."}
        </p>

        {/* Botões */}
        <div className="flex gap-3">
          <button 
            onClick={onClose} 
            className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-colors text-sm"
          >
            Cancelar
          </button>
          <button 
            onClick={onConfirm} 
            className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-600/20 transition-colors text-sm"
          >
            Sim, Excluir
          </button>
        </div>

      </div>
    </div>
  )
}