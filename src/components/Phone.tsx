import { cn } from '@/lib/utils'
import { HTMLAttributes } from 'react'

interface PhoneProps extends HTMLAttributes<HTMLDivElement> {
  imgSrc: string
  dark?: boolean
}

const Phone = ({ imgSrc, className, dark = false, ...props }: PhoneProps) => {
  return (
    <div
      className={cn(
        'relative pointer-events-none z-50 overflow-hidden',
        className
      )}
      {...props}
    >
      {/* Phone frame */}
      <img
        src={
          dark
            ? '/phone-template-dark-edges.png'
            : '/phone-template-white-edges.png'
        }
        className="pointer-events-none z-50 select-none relative block w-full h-auto"
        alt="phone image"
      />

      {/* Overlay image */}
      <div className="absolute inset-0 -z-10">
        <img
          src={imgSrc}
          alt="overlaying phone image"
          className="w-full h-full object-cover block"
        />
      </div>
    </div>
  )
}

export default Phone
