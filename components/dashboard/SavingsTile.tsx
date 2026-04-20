'use client'

import { useRef, useEffect } from 'react'
import AccountTile from '@/components/dashboard/AccountTile'
import type { DashboardAccount } from '@/lib/dashboard/get-dashboard-summary'

interface SavingsTileProps {
  accounts: DashboardAccount[]
}

/**
 * Wraps AccountTile (savings) and height-locks it to the BVA card via
 * getElementById('bva-card-anchor'). Savings tile scrolls internally when
 * accounts exceed the available height.
 */
export default function SavingsTile({ accounts }: SavingsTileProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const bva = document.getElementById('bva-card-anchor')
    if (!bva || !wrapperRef.current) return

    const setHeight = () => {
      const h = bva.getBoundingClientRect().height
      if (h > 0 && wrapperRef.current) {
        wrapperRef.current.style.height = `${h}px`
      }
    }

    setHeight()
    window.addEventListener('resize', setHeight)
    return () => window.removeEventListener('resize', setHeight)
  }, [])

  return (
    <div
      ref={wrapperRef}
      style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      <AccountTile kind="savings" accounts={accounts} fillHeight />
    </div>
  )
}
