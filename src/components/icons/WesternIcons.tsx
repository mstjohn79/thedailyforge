import React from 'react'

interface IconProps {
  className?: string
  size?: number
}

// Mountain with cross
export const MountainCrossIcon: React.FC<IconProps> = ({ 
  className = "w-6 h-6", 
  size = 24 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Mountain outline */}
      <path d="M3 20l9-16 9 16H3z" />
      {/* Cross on the mountain */}
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </svg>
  )
}

// Compass with cross in center
export const CompassCrossIcon: React.FC<IconProps> = ({ 
  className = "w-6 h-6", 
  size = 24 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6l0 12" />
      <path d="M6 12l12 0" />
      <path d="M12 2l2 2-2 2-2-2z" />
      <path d="M12 20l2-2-2-2-2 2z" />
      <path d="M2 12l2-2 2 2-2 2z" />
      <path d="M20 12l-2-2-2 2 2 2z" />
    </svg>
  )
}

// Shield with cross
export const ShieldCrossIcon: React.FC<IconProps> = ({ 
  className = "w-6 h-6", 
  size = 24 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </svg>
  )
}

// Crown with cross
export const CrownCrossIcon: React.FC<IconProps> = ({ 
  className = "w-6 h-6", 
  size = 24 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M2 4l3 12h14l3-12H2z" />
      <path d="M6 16l6-6 6 6" />
      <path d="M12 6v6" />
      <path d="M9 9h6" />
    </svg>
  )
}

// Mountain range with cross
export const MountainRangeCrossIcon: React.FC<IconProps> = ({ 
  className = "w-6 h-6", 
  size = 24 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Mountain range */}
      <path d="M2 20l4-8 4 4 4-12 4 8 4-4v8H2z" />
      {/* Cross on the highest peak */}
      <path d="M14 8v4" />
      <path d="M12 10h4" />
    </svg>
  )
}

// Cross icon - actual cross design
export const CrossIcon: React.FC<IconProps> = ({ 
  className = "w-6 h-6", 
  size = 24 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Vertical line - longer */}
      <path d="M12 2v20" />
      {/* Horizontal line - shorter, positioned higher */}
      <path d="M6 10h12" />
    </svg>
  )
}

// Shield icon - modern outline style
export const ShieldIcon: React.FC<IconProps> = ({ 
  className = "w-6 h-6", 
  size = 24 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Shield outline */}
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      {/* Shield design lines */}
      <path d="M12 4l0 16" />
      <path d="M8 8l8 0" />
      <path d="M8 12l8 0" />
    </svg>
  )
}
