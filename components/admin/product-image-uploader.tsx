'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  Camera,
  CheckCircle2,
  ImagePlus,
  LoaderCircle,
  RefreshCw,
  Trash2,
  Upload,
} from 'lucide-react'
import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import {
  getProductImageUrl,
  PRODUCT_IMAGES_BUCKET,
} from '@/lib/supabase/storage'

const MAX_SOURCE_SIZE = 15 * 1024 * 1024
const OUTPUT_SIZE = 1400
const OUTPUT_QUALITY = 0.84

async function optimizeProductImage(file: File) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('La imagen debe ser JPG, PNG o WebP.')
  }
  if (file.size > MAX_SOURCE_SIZE) {
    throw new Error('La foto supera los 15 MB.')
  }

  let source: CanvasImageSource
  let sourceWidth: number
  let sourceHeight: number
  let cleanup: () => void

  try {
    const bitmap = await createImageBitmap(file, {
      imageOrientation: 'from-image',
    })
    source = bitmap
    sourceWidth = bitmap.width
    sourceHeight = bitmap.height
    cleanup = () => bitmap.close()
  } catch {
    const objectUrl = URL.createObjectURL(file)
    const image = new window.Image()
    image.decoding = 'async'
    image.src = objectUrl
    await image.decode()
    source = image
    sourceWidth = image.naturalWidth
    sourceHeight = image.naturalHeight
    cleanup = () => URL.revokeObjectURL(objectUrl)
  }

  const canvas = document.createElement('canvas')
  canvas.width = OUTPUT_SIZE
  canvas.height = OUTPUT_SIZE

  const context = canvas.getContext('2d')
  if (!context) {
    cleanup()
    throw new Error('Este navegador no pudo preparar la imagen.')
  }

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE)

  const availableSize = OUTPUT_SIZE * 0.9
  const scale = Math.min(
    availableSize / sourceWidth,
    availableSize / sourceHeight,
    1,
  )
  const width = sourceWidth * scale
  const height = sourceHeight * scale
  const x = (OUTPUT_SIZE - width) / 2
  const y = (OUTPUT_SIZE - height) / 2

  context.drawImage(source, x, y, width, height)
  cleanup()

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/webp', OUTPUT_QUALITY)
  })

  if (!blob) throw new Error('No pudimos optimizar la imagen.')
  return blob
}

type ProductImageUploaderProps = {
  productId: string
  productName: string
  initialImagePath: string | null
}

export function ProductImageUploader({
  productId,
  productName,
  initialImagePath,
}: ProductImageUploaderProps) {
  const router = useRouter()
  const libraryInput = useRef<HTMLInputElement>(null)
  const cameraInput = useRef<HTMLInputElement>(null)
  const [imagePath, setImagePath] = useState(initialImagePath)
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const imageUrl = getProductImageUrl(imagePath)

  async function uploadImage(file: File) {
    setBusy(true)
    setError('')
    setSuccess('')

    try {
      const optimized = await optimizeProductImage(file)
      const newPath = `${productId}/cover-${Date.now()}.webp`
      const supabase = createSupabaseBrowserClient()
      const { error: uploadError } = await supabase.storage
        .from(PRODUCT_IMAGES_BUCKET)
        .upload(newPath, optimized, {
          contentType: 'image/webp',
          cacheControl: '31536000',
          upsert: false,
        })

      if (uploadError) throw uploadError

      const { error: updateError } = await supabase
        .from('products')
        .update({ image_path: newPath, updated_at: new Date().toISOString() })
        .eq('id', productId)

      if (updateError) {
        await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([newPath])
        throw updateError
      }

      const previousPath = imagePath
      setImagePath(newPath)
      setSuccess('Imagen optimizada y guardada.')

      if (previousPath && previousPath !== newPath) {
        await supabase.storage
          .from(PRODUCT_IMAGES_BUCKET)
          .remove([previousPath])
      }

      router.refresh()
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'No pudimos subir la imagen.',
      )
    } finally {
      setBusy(false)
      if (libraryInput.current) libraryInput.current.value = ''
      if (cameraInput.current) cameraInput.current.value = ''
    }
  }

  function handleInput(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) void uploadImage(file)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files?.[0]
    if (file) void uploadImage(file)
  }

  async function removeImage() {
    if (!imagePath || !window.confirm('¿Querés eliminar la imagen de este producto?')) {
      return
    }

    setBusy(true)
    setError('')
    setSuccess('')
    const previousPath = imagePath
    const supabase = createSupabaseBrowserClient()
    const { error: updateError } = await supabase
      .from('products')
      .update({ image_path: null, published: false, updated_at: new Date().toISOString() })
      .eq('id', productId)

    if (updateError) {
      setError(updateError.message)
      setBusy(false)
      return
    }

    const { error: removeError } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .remove([previousPath])

    setImagePath(null)
    setSuccess(
      removeError
        ? 'La imagen se quitó del producto, pero quedó un archivo pendiente de limpiar.'
        : 'Imagen eliminada. El producto quedó sin publicar.',
    )
    setBusy(false)
    router.refresh()
  }

  return (
    <section className="rounded-2xl border bg-white p-5 shadow-sm">
      <h2 className="font-extrabold">Imagen principal</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        La app la ajusta a formato cuadrado y WebP.
      </p>

      <div
        onDragEnter={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative mt-4 aspect-square overflow-hidden rounded-2xl border border-dashed bg-background transition ${
          dragging ? 'border-primary bg-primary/5 ring-3 ring-primary/10' : ''
        }`}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={productName}
            fill
            sizes="(max-width: 1280px) 90vw, 340px"
            className="object-contain"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-center">
            <div>
              <ImagePlus className="mx-auto size-10 text-muted-foreground" />
              <p className="mt-3 text-sm font-bold">Sin imagen</p>
              <p className="mt-1 px-6 text-xs text-muted-foreground">
                Arrastrá una foto o elegila desde el dispositivo.
              </p>
            </div>
          </div>
        )}

        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/85 backdrop-blur-sm">
            <div className="text-center">
              <LoaderCircle className="mx-auto size-8 animate-spin text-primary" />
              <p className="mt-2 text-sm font-bold">Preparando imagen…</p>
            </div>
          </div>
        )}
      </div>

      <input
        ref={libraryInput}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInput}
        className="sr-only"
      />
      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleInput}
        className="sr-only"
      />

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => libraryInput.current?.click()}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {imagePath ? <RefreshCw className="size-4" /> : <Upload className="size-4" />}
          {imagePath ? 'Reemplazar' : 'Elegir foto'}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => cameraInput.current?.click()}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border bg-white px-3 text-sm font-bold text-primary disabled:opacity-50"
        >
          <Camera className="size-4" />
          Cámara
        </button>
      </div>

      {imagePath && (
        <button
          type="button"
          disabled={busy}
          onClick={removeImage}
          className="mt-2 inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-destructive transition hover:bg-destructive/10 disabled:opacity-50"
        >
          <Trash2 className="size-4" />
          Eliminar imagen
        </button>
      )}

      {success && (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-success/10 p-3 text-xs font-bold text-success">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          {success}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-destructive/10 p-3 text-xs font-bold text-destructive">
          {error}
        </p>
      )}
    </section>
  )
}
