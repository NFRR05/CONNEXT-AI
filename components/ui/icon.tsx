import Image from 'next/image'
import { cn } from '@/lib/utils'

interface IconProps {
  src: string
  alt: string
  size?: number
  className?: string
  variant?: 'light' | 'dark' // light = black icon (for white bg), dark = white icon (for dark bg)
}

export function Icon({ src, alt, size = 20, className, variant = 'light' }: IconProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn(
        "flex-shrink-0",
        variant === 'light' 
          ? "opacity-70" // Black icons on white background - use opacity for gray effect
          : "brightness-0 invert opacity-90", // White icons on dark background
        className
      )}
    />
  )
}

