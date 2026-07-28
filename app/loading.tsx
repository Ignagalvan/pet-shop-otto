import { PawPrint } from 'lucide-react'

const steps = [1, 2, 3, 4, 5]

export default function Loading() {
  return (
    <div
      className="flex min-h-[55vh] flex-col items-center justify-center px-4 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="paw-loading-track" aria-hidden="true">
        {steps.map((step) => (
          <div key={step} className={`paw-loading-step paw-loading-step-${step}`}>
            <PawPrint />
          </div>
        ))}
      </div>
      <p className="mt-6 font-display text-base font-extrabold text-brand">
        Preparando todo para tu mascota...
      </p>
      <span className="mt-1 text-sm text-muted-foreground">Ya casi estamos</span>
    </div>
  )
}
