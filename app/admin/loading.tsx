import { LoaderCircle } from 'lucide-react'

export default function AdminLoading() {
  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center p-8">
      <div className="text-center">
        <LoaderCircle className="mx-auto size-8 animate-spin text-primary" />
        <p className="mt-3 text-sm font-bold text-muted-foreground">
          Cargando información…
        </p>
      </div>
    </div>
  )
}
