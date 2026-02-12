import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outline'
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default: 'bg-slate-800/80 backdrop-blur-sm border border-slate-700 shadow-sm',
      elevated: 'bg-slate-800/80 backdrop-blur-sm border border-slate-700 shadow-lg hover:shadow-xl transition-shadow duration-300',
      outline: 'border-2 border-slate-600/50 bg-slate-800/60'
    }

    return (
      <motion.div
        ref={ref}
        className={cn('rounded-xl p-6', variants[variant], className)}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

Card.displayName = 'Card'