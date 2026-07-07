import React from 'react';
import { useSynapse } from '../../context/SynapseContext';
import { X, CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';

const iconMap = {
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
  error: XCircle,
};

const colorMap = {
  success: 'border-green-500/50 bg-green-500/10',
  warning: 'border-orange-500/50 bg-orange-500/10',
  info: 'border-blue-500/50 bg-blue-500/10',
  error: 'border-red-500/50 bg-red-500/10',
};

const iconColorMap = {
  success: 'text-green-400',
  warning: 'text-orange-400',
  info: 'text-blue-400',
  error: 'text-red-400',
};

const Toast = () => {
  const { toasts, dismissToast } = useSynapse();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => {
        const Icon = iconMap[toast.type] || Info;
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl min-w-[320px] max-w-[420px] animate-slide-in ${colorMap[toast.type] || colorMap.info}`}
          >
            <Icon size={18} className={`mt-0.5 shrink-0 ${iconColorMap[toast.type]}`} />
            <div className="flex-grow min-w-0">
              <div className="text-sm font-semibold text-white">{toast.title}</div>
              <div className="text-xs text-text-secondary mt-0.5 truncate">{toast.message}</div>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="shrink-0 text-text-tertiary hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default Toast;
