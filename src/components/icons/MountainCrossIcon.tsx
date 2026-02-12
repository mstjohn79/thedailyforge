import React from 'react'

interface MountainCrossIconProps {
  className?: string
  size?: number
}

export const MountainCrossIcon: React.FC<MountainCrossIconProps> = ({ 
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

export const MountainCrossIconSolid: React.FC<MountainCrossIconProps> = ({ 
  className = "w-6 h-6", 
  size = 24 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      {/* Mountain with cross - filled version */}
      <path d="M3 20l9-16 9 16H3z" />
      {/* Cross overlay */}
      <path d="M12 8v8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 12h8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
