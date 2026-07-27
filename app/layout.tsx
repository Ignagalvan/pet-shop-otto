import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Nunito, Poppins } from 'next/font/google'
import './globals.css'
import { StoreProvider } from '@/components/store-provider'
import { ToastProvider } from '@/components/toast-provider'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { SiteFooterVisibility } from '@/components/site-footer-visibility'
import { MobileTabBar } from '@/components/mobile-tab-bar'
import { WhatsappWidget } from '@/components/whatsapp-widget'
import { CartDrawer } from '@/components/cart-drawer'
import { ClosedStoreNotice } from '@/components/closed-store-notice'
import { BRAND_FULL_NAME } from '@/lib/data'

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: `${BRAND_FULL_NAME} — Todo para tu mascota`,
    template: `%s | ${BRAND_FULL_NAME}`,
  },
  description:
    'Alimentos, juguetes, higiene y accesorios para perros, gatos y más. Envíos rápidos, retiro en el local y atención personalizada por WhatsApp.',
  applicationName: BRAND_FULL_NAME,
  authors: [{ name: BRAND_FULL_NAME }],
  creator: BRAND_FULL_NAME,
  publisher: BRAND_FULL_NAME,
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#174a7e',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${nunito.variable} ${poppins.variable} bg-background`}>
      <body className="min-h-dvh">
        <ToastProvider>
          <StoreProvider>
            <div className="flex min-h-dvh flex-col">
              <SiteHeader />
              <ClosedStoreNotice />
              <main className="flex-1 pb-16 md:pb-0">{children}</main>
              <SiteFooterVisibility>
                <SiteFooter />
              </SiteFooterVisibility>
            </div>
            <MobileTabBar />
            <WhatsappWidget />
            <CartDrawer />
          </StoreProvider>
        </ToastProvider>
        {process.env.VERCEL === '1' && <Analytics />}
      </body>
    </html>
  )
}
