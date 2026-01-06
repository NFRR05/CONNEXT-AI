import * as React from "react"
import { cn } from "@/lib/utils"

export interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg"
  variant?: "default" | "primary" | "secondary" | "muted"
}

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-10 w-10 border-4",
  lg: "h-16 w-16 border-4",
}

const variantClasses = {
  default: "border-primary border-t-transparent",
  primary: "border-primary border-t-transparent",
  secondary: "border-secondary border-t-transparent",
  muted: "border-muted-foreground/30 border-t-transparent",
}

export function Loader({
  className,
  size = "md",
  variant = "default",
  ...props
}: LoaderProps) {
  return (
    <div
      className={cn(
        "flex animate-spin items-center justify-center rounded-full",
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  )
}

// Default export for backward compatibility
export default function ClassicLoader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <Loader className={className} {...props} />
}

