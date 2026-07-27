'use client'

import { RotateCcw } from 'lucide-react'

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="es">
      <body>
        <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, fontFamily: 'system-ui, sans-serif', color: '#14233a', background: '#fff9f1' }}>
          <section style={{ maxWidth: 520, textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, margin: '0 auto', display: 'grid', placeItems: 'center', borderRadius: 18, color: 'white', background: '#174a7e' }}>
              <RotateCcw size={28} />
            </div>
            <p style={{ marginTop: 24, color: '#9a6846', fontSize: 12, fontWeight: 800, letterSpacing: 2 }}>PET SHOP OTTO</p>
            <h1 style={{ margin: '8px 0 0', fontSize: 30 }}>Necesitamos volver a cargar la tienda</h1>
            <p style={{ marginTop: 12, lineHeight: 1.6, color: '#5b6b80' }}>Ocurrió un error inesperado. Tus datos no fueron enviados.</p>
            <button onClick={reset} style={{ marginTop: 24, minHeight: 48, border: 0, borderRadius: 12, padding: '0 24px', color: 'white', background: '#174a7e', fontWeight: 800, cursor: 'pointer' }}>
              Volver a intentar
            </button>
          </section>
        </main>
      </body>
    </html>
  )
}
