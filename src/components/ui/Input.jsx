import React from 'react'
import clsx from 'clsx'

const Input = ({
  label,
  error,
  helperText,
  className = '',
  ...props
}) => {
  const inputClasses = clsx(
    'block w-full px-3 py-2 border rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm',
    {
      'border-slate-300': !error,
      'border-danger-300 focus:ring-danger-500 focus:border-danger-500': error
    },
    className
  )

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {label}
        </label>
      )}
      <input
        className={inputClasses}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-danger-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-slate-500">{helperText}</p>
      )}
    </div>
  )
}

export default Input