'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { CartDrawer } from '@/components/cart-drawer'
import { ClosedStoreNotice } from '@/components/closed-store-notice'
import { CompactSiteFooter } from '@/components/compact-site-footer'
import { MobileTabBar } from '@/components/mobile-tab-bar'
import { PawEntrySplash } from '@/components/paw-entry-splash'
import { SiteFooter } from '@/components/site-footer'
import { SiteFooterVisibility } from '@/components/site-footer-visibility'
import { SiteHeader } from '@/components/site-header'
import { WhatsappWidget } from '@/components/whatsapp-widget'

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith('/admin')

  if (isAdmin) {
    return <main className="min-h-dvh bg-[#f6f8fb]">{children}</main>
  }

  return (
    <>
      <PawEntrySplash />
      <div className="flex min-h-dvh flex-col">
        <SiteHeader />
        <ClosedStoreNotice />
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
        <SiteFooterVisibility
          full={<SiteFooter />}
          compact={<CompactSiteFooter />}
        />
      </div>
      <MobileTabBar />
      <WhatsappWidget />
      <CartDrawer />
    </>
  )
}
