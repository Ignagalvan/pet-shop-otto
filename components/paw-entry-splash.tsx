'use client'

import { useEffect, useState } from 'react'
import { PawPrint } from 'lucide-react'

export function PawEntrySplash() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timeout = window.setTimeout(() => setVisible(false), 1150)
    return () => window.clearTimeout(timeout)
  }, [])

  if (!visible) return null

  return (
    <div className="paw-entry-splash" aria-hidden="true">
      <div className="paw-entry-glow" />
      <div className="paw-entry-flash paw-entry-flash-one">
        <PawPrint />
      </div>
      <div className="paw-entry-flash paw-entry-flash-two">
        <PawPrint />
      </div>
    </div>
  )
}
