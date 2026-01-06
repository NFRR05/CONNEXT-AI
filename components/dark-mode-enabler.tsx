'use client'

import { useEffect } from 'react'

export function DarkModeEnabler() {
  useEffect(() => {
    document.documentElement.classList.add('dark')
    return () => {
      // Don't remove on unmount to avoid flicker
    }
  }, [])

  return null
}


