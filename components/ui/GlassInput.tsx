import React from 'react';

interface GlassInputProps {
  label?: string;
  error?: string;
  type?: 'text' | 'number' | 'password' | 'email' | 'textarea' | 'select';
  options?: string[]; // For select
  value: any;
  onChange: (value: any) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  rows?: number; // For textarea
}

export const GlassInput: React.FC<GlassInputProps> = ({
  label,
  error,
  type = 'text',
  options = [],
  value,
  onChange,
  placeholder,
  required,
  className = '',
  rows = 4
}) => {
  const baseInputStyles = `
    w-full bg-slate-900/50 border border-white/10 rounded-xl p-4 
    text-white placeholder-slate-500 outline-none 
    focus:border-indigo-500 focus:bg-slate-900/80 focus:shadow-[0_0_20px_rgba(99,102,241,0.3)]
    transition-all duration-300 backdrop-blur-sm
  `;

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className="block text-slate-300 text-sm font-medium mb-2">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}

      {type === 'textarea' ? (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={`${baseInputStyles} resize-none`}
        />
      ) : type === 'select' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {options.map((opt) => (
                <button
                    key={opt}
                    type="button"
                    onClick={() => onChange(opt)}
                    className={`p-3 rounded-xl border text-sm transition-all duration-300
                        ${value === opt 
                            ? 'border-indigo-500 bg-indigo-600/20 text-white shadow-lg shadow-indigo-500/20 scale-[1.02]' 
                            : 'border-white/10 bg-slate-800/40 text-slate-400 hover:bg-white/5 hover:text-white'
                        }`}
                >
                    {opt}
                </button>
            ))}
        </div>
      ) : (
        <input
          type={type}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={baseInputStyles}
        />
      )}

      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
};