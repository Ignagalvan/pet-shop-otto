'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  BedDouble,
  Bone,
  Cookie,
  Droplets,
  Footprints,
  Gamepad2,
  PawPrint,
  ShoppingBag,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { categories, petTypes } from '@/lib/data'
import type { PetType } from '@/lib/types'
import { cn } from '@/lib/utils'

const iconMap = {
  bone: Bone,
  cookie: Cookie,
  'gamepad-2': Gamepad2,
  droplets: Droplets,
  'bed-double': BedDouble,
  footprints: Footprints,
  'shopping-bag': ShoppingBag,
} as const

export function CategoryGrid() {
  const [selectedPet, setSelectedPet] = useState<PetType | null>(null)
  const needsRef = useRef<HTMLDivElement>(null)
  const pet = petTypes.find((item) => item.slug === selectedPet)

  useEffect(() => {
    if (!selectedPet) return

    const frameId = window.requestAnimationFrame(() => {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      needsRef.current?.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'start',
      })
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [selectedPet])

  return (
    <section id="elegi-tu-mascota" className="scroll-mt-24 px-4 py-10 md:py-16">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-brand/10 bg-gradient-to-b from-brand-light/70 via-card to-card shadow-sm">
        <div className="px-4 py-8 sm:px-8 md:px-10 md:py-12">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.16em] text-brand shadow-sm">
              <PawPrint className="size-4" aria-hidden="true" />
              Una compra pensada para ellos
            </span>
            <h2 className="mt-4 font-display text-3xl font-extrabold text-foreground text-balance md:text-4xl">
              Elegí a tu mascota
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              Contanos para quién estás buscando y te ayudamos a llegar más rápido a lo que
              necesita.
            </p>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-6">
            {petTypes.map((item) => {
              const selected = item.slug === selectedPet

              return (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => setSelectedPet(item.slug)}
                  aria-pressed={selected}
                  className={cn(
                    'group relative flex min-w-0 flex-col items-center gap-3 rounded-2xl border bg-card p-4 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
                    selected
                      ? 'border-brand ring-2 ring-brand/15'
                      : 'border-border hover:border-brand/40',
                  )}
                >
                  {selected ? (
                    <span className="absolute right-2.5 top-2.5 flex size-7 items-center justify-center rounded-full bg-brand text-white shadow-sm">
                      <PawPrint className="size-4" aria-hidden="true" />
                    </span>
                  ) : null}
                  <span className="relative size-24 overflow-hidden rounded-full bg-secondary/60 md:size-28">
                    <Image
                      src={item.image || '/placeholder.svg'}
                      alt=""
                      fill
                      sizes="112px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </span>
                  <span className="truncate font-bold text-foreground">{item.label}</span>
                </button>
              )
            })}
          </div>

          <div className="mt-5 text-center">
            <Link
              href="/productos"
              className="inline-flex items-center gap-2 text-sm font-bold text-brand hover:underline"
            >
              Prefiero ver todos los productos
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          {pet ? (
            <div ref={needsRef} className="mt-2 scroll-mt-32" aria-live="polite">
              <PawTrail />

              <div className="mx-auto max-w-2xl text-center">
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand">
                  Para {pet.label}
                </p>
                <h3 className="mt-2 font-display text-2xl font-extrabold text-foreground md:text-3xl">
                  ¿Qué necesita hoy?
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Elegiste <strong className="text-foreground">{pet.label}</strong>. Ahora elegí una
                  opción y te mostramos solamente productos relacionados.
                </p>
              </div>

              <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
                {categories.map((category) => {
                  const Icon = iconMap[category.icon as keyof typeof iconMap] ?? ShoppingBag

                  return (
                    <Link
                      key={category.slug}
                      href={`/productos?mascota=${pet.slug}&categoria=${category.slug}`}
                      className="group flex min-w-0 flex-col items-center gap-2.5 rounded-2xl border border-border bg-card p-4 text-center shadow-sm transition-all hover:-translate-y-1 hover:border-brand/40 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    >
                      <span className="flex size-13 items-center justify-center rounded-2xl bg-brand-light text-brand transition-colors group-hover:bg-brand group-hover:text-white">
                        <Icon className="size-6" aria-hidden="true" />
                      </span>
                      <span className="text-sm font-extrabold text-foreground">{category.label}</span>
                      <span className="hidden line-clamp-2 text-xs text-muted-foreground sm:block">
                        {category.description}
                      </span>
                    </Link>
                  )
                })}
              </div>

              <div className="mt-6 flex justify-center">
                <Link
                  href={`/productos?mascota=${pet.slug}`}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-extrabold text-white transition-colors hover:bg-brand/90 sm:w-auto"
                >
                  Ver todo para {pet.label.toLocaleLowerCase('es')}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function PawTrail() {
  return (
    <div className="flex items-center justify-center gap-4 py-5 text-brand/30" aria-hidden="true">
      <PawPrint className="size-4 -rotate-[22deg]" />
      <PawPrint className="size-5 rotate-[14deg]" />
      <PawPrint className="size-4 -rotate-[12deg]" />
    </div>
  )
}
