import React from 'react'
import clsx from 'clsx'

const Card = ({
  children,
  className = '',
  padding = 'md',
  ...props
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  const classes = clsx(
    'bg-white rounded-lg border border-slate-200 shadow-sm',
    paddingClasses[padding],
    className
  )

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  )
}

export default Card