import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Nunito, Poppins } from 'next/font/google'
import './globals.css'
import { AppShell } from '@/components/app-shell'
import { StoreProvider } from '@/components/store-provider'
import { ToastProvider } from '@/components/toast-provider'
import { BRAND_FULL_NAME } from '@/lib/data'
import { getPublicStoreSettings } from '@/lib/store-settings-server'

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const settings = await getPublicStoreSettings()

  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
      className={`${nunito.variable} ${poppins.variable} bg-background`}
    >
      <body className="min-h-dvh" suppressHydrationWarning>
        <ToastProvider>
          <StoreProvider settings={settings}>
            <AppShell>{children}</AppShell>
          </StoreProvider>
        </ToastProvider>
        {process.env.VERCEL === '1' && <Analytics />}
      </body>
    </html>
  )
}
