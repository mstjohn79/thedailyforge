import React from 'react'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea: React.FC<TextareaProps> = ({ 
  label, 
  error, 
  className = '', 
  ...props 
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-slate-200">
          {label}
        </label>
      )}
      <textarea
        className={`
          w-full px-4 py-3 border-2 border-slate-600/50 rounded-lg 
          bg-slate-700/60 text-white placeholder-slate-400
          focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 
          transition-colors duration-200 resize-none
          ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  )
}
