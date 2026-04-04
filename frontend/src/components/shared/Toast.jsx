import React from 'react';
import { useToast } from '../../contexts/ToastContext';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiXCircle, FiX } from 'react-icons/fi';

const Toast = () => {
  const { toast, hideToast } = useToast();

  if (!toast.isVisible) return null;

  const getToastConfig = (type) => {
    switch (type) {
      case 'success':
        return {
          icon: <FiCheckCircle className="text-xl" />,
          bgColor: 'bg-brand-success',
          textColor: 'text-white'
        };
      case 'error':
        return {
          icon: <FiXCircle className="text-xl" />,
          bgColor: 'bg-brand-error', // Solid red-600
          textColor: 'text-white'
        };
      case 'warning':
        return {
          icon: <FiAlertCircle className="text-xl" />,
          bgColor: 'bg-brand-warning', // Solid orange-500
          textColor: 'text-white'
        };
      default:
        return {
          icon: <FiInfo className="text-xl" />,
          bgColor: 'bg-brand-primary', // Solid Deep Blue
          textColor: 'text-white'
        };
    }
  };

  const config = getToastConfig(toast.type);

  return (
    <div className="fixed top-20 right-6 z-[9999] w-full max-w-sm" style={{ animation: 'toast-slide-in 0.3s ease-out forwards' }}>
      <div 
        className={`flex items-start gap-3 p-4 rounded-lg shadow-md ${config.bgColor} ${config.textColor}`}
        role="alert"
      >
        <div className="flex-shrink-0 mt-0.5">
          {config.icon}
        </div>
        <div className="flex-1 font-medium">
          {toast.message}
        </div>
        <button 
          onClick={hideToast}
          className="flex-shrink-0 ml-2 opacity-80 hover:opacity-100 transition-opacity"
          aria-label="Close notification"
        >
          <FiX className="text-xl" />
        </button>
      </div>
      <style>{`
        @keyframes toast-slide-in {
          0% { transform: translateY(-20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Toast;
