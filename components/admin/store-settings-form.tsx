'use client'

import { useActionState } from 'react'
import {
  Banknote,
  CheckCircle2,
  Clock3,
  CreditCard,
  LoaderCircle,
  MapPin,
  PackageCheck,
  Save,
  Store,
  Truck,
} from 'lucide-react'
import {
  updateStoreSettingsAction,
  type SettingsActionState,
} from '@/app/admin/configuracion/actions'
import type {
  BusinessDay,
  PaymentMethod,
  StoreSettings,
} from '@/lib/store-settings'

const INITIAL_STATE: SettingsActionState = { ok: false, message: '' }
const DAYS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
]

const PAYMENTS: {
  value: PaymentMethod
  title: string
  detail: string
  icon: typeof CreditCard
}[] = [
  {
    value: 'local',
    title: 'Pago en el local',
    detail: 'Disponible para pedidos con retiro',
    icon: Store,
  },
  {
    value: 'transferencia',
    title: 'Transferencia',
    detail: 'Datos bancarios al confirmar',
    icon: Banknote,
  },
  {
    value: 'entrega',
    title: 'Pago al recibir',
    detail: 'Disponible para pedidos con envío',
    icon: MapPin,
  },
]

const input =
  'mt-2 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10'

export function StoreSettingsForm({
  settings,
}: {
  settings: StoreSettings
}) {
  const [state, formAction, pending] = useActionState(
    updateStoreSettingsAction,
    INITIAL_STATE,
  )

  return (
    <form action={formAction} className="space-y-6">
      <SettingsSection
        icon={Store}
        title="Datos del negocio"
        description="Estos datos aparecen en contacto, pie de página y accesos rápidos."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="WhatsApp"
            name="whatsappNumber"
            defaultValue={settings.whatsappNumber}
            placeholder="5493511234567"
            inputMode="tel"
            required
            help="Código de país y característica, solo números."
          />
          <Field
            label="Instagram"
            name="instagram"
            defaultValue={settings.instagram}
            placeholder="pet_shop.otto"
          />
          <Field
            label="Correo electrónico"
            name="email"
            defaultValue={settings.email}
            placeholder="ventas@petshopotto.com"
            type="email"
          />
          <Field
            label="Dirección del local"
            name="address"
            defaultValue={settings.address}
            placeholder="Calle, número, localidad"
            required
          />
        </div>
      </SettingsSection>

      <SettingsSection
        icon={Clock3}
        title="Horarios de atención"
        description="Podés abrir uno o dos turnos por día. El aviso de local cerrado se actualiza automáticamente."
      >
        <div className="space-y-3">
          {DAYS.map((label, day) => {
            const schedule =
              settings.businessHours.days.find((item) => item.day === day) ??
              ({ day, enabled: false, shifts: [] } satisfies BusinessDay)
            return (
              <DaySchedule
                key={label}
                day={day}
                label={label}
                schedule={schedule}
              />
            )
          })}
        </div>
        <label className="mt-5 block text-sm font-bold">
          Mensaje cuando el local está cerrado
          <textarea
            name="closedStoreMessage"
            defaultValue={settings.closedStoreMessage}
            rows={3}
            maxLength={280}
            className="mt-2 w-full rounded-xl border border-border bg-white p-3 text-sm leading-6 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </label>
      </SettingsSection>

      <SettingsSection
        icon={Truck}
        title="Entrega y retiro"
        description="Los importes se usan en el carrito, el checkout y el total guardado del pedido."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <ToggleCard
            name="deliveryEnabled"
            defaultChecked={settings.deliveryEnabled}
            icon={Truck}
            title="Envío a domicilio"
            detail="Permitir que los clientes pidan entrega."
          />
          <ToggleCard
            name="pickupEnabled"
            defaultChecked={settings.pickupEnabled}
            icon={PackageCheck}
            title="Retiro en el local"
            detail="El retiro siempre aparece sin costo."
          />
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field
            label="Costo de envío"
            name="shippingCost"
            defaultValue={String(settings.shippingCost)}
            type="number"
            min="0"
            step="1"
            required
            prefix="$"
          />
          <Field
            label="Envío gratis desde"
            name="freeShippingThreshold"
            defaultValue={
              settings.freeShippingThreshold === null
                ? ''
                : String(settings.freeShippingThreshold)
            }
            type="number"
            min="1"
            step="1"
            prefix="$"
            help="Dejalo vacío si no ofrecés envío gratis."
          />
        </div>
      </SettingsSection>

      <SettingsSection
        icon={CreditCard}
        title="Formas de pago"
        description="Solo las opciones marcadas estarán disponibles al finalizar la compra."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {PAYMENTS.map((payment) => (
            <ToggleCard
              key={payment.value}
              name="paymentMethod"
              value={payment.value}
              defaultChecked={settings.paymentMethods.includes(payment.value)}
              icon={payment.icon}
              title={payment.title}
              detail={payment.detail}
            />
          ))}
        </div>
        <div className="mt-6 rounded-2xl border border-primary/15 bg-primary/5 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
              <Banknote className="size-5" />
            </span>
            <div>
              <h3 className="font-extrabold">Datos para transferencias</h3>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                Se muestran al cliente cuando elige transferencia. Podés
                modificarlos cuando cambie la cuenta.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field
              label="Alias"
              name="transferAlias"
              defaultValue={settings.transferAlias}
              placeholder="petshop.otto"
            />
            <Field
              label="Titular de la cuenta"
              name="transferHolder"
              defaultValue={settings.transferHolder}
              placeholder="Nombre o razón social"
            />
            <Field
              label="Banco o billetera"
              name="transferBank"
              defaultValue={settings.transferBank}
              placeholder="Ej. Banco Nación"
            />
            <Field
              label="CBU o CVU (opcional)"
              name="transferCbu"
              defaultValue={settings.transferCbu}
              placeholder="0000000000000000000000"
            />
          </div>
          <label className="mt-4 block text-sm font-bold">
            Instrucciones para el comprobante
            <textarea
              name="transferInstructions"
              defaultValue={settings.transferInstructions}
              rows={3}
              maxLength={280}
              className="mt-2 w-full rounded-xl border border-border bg-white p-3 text-sm leading-6 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
              placeholder="Después de transferir, enviá el comprobante por WhatsApp."
            />
          </label>
          {!settings.transferAlias && !settings.transferCbu && (
            <p className="mt-3 text-xs font-semibold leading-5 text-amber-700">
              Completá al menos el alias o el CBU para que el cliente pueda
              transferir sin esperar una respuesta.
            </p>
          )}
        </div>
      </SettingsSection>

      <div className="sticky bottom-3 z-20 rounded-2xl border bg-white/95 p-3 shadow-lg backdrop-blur sm:flex sm:items-center sm:justify-between sm:gap-4">
        <div
          role="status"
          className={`mb-3 flex min-h-6 items-center gap-2 text-sm font-bold sm:mb-0 ${
            state.ok ? 'text-success' : 'text-destructive'
          }`}
        >
          {state.message &&
            (state.ok ? (
              <CheckCircle2 className="size-4 shrink-0" />
            ) : (
              <CreditCard className="size-4 shrink-0" />
            ))}
          {state.message}
        </div>
        <button
          disabled={pending}
          className="flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-success px-5 text-sm font-extrabold text-white transition hover:bg-success/90 disabled:cursor-wait disabled:opacity-60 sm:w-auto"
        >
          {pending ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {pending ? 'Guardando…' : 'Guardar y aplicar'}
        </button>
      </div>
    </form>
  )
}

function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Store
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-3xl border bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-6 flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
        <div>
          <h2 className="text-lg font-extrabold">{title}</h2>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      {children}
    </section>
  )
}

function Field({
  label,
  help,
  prefix,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
  help?: string
  prefix?: string
}) {
  return (
    <label className="min-w-0 text-sm font-bold">
      {label}
      <span className="relative block">
        {prefix && (
          <span className="pointer-events-none absolute bottom-0 left-3 top-2 flex items-center text-sm font-bold text-muted-foreground">
            {prefix}
          </span>
        )}
        <input
          {...props}
          className={`${input} ${prefix ? 'pl-7' : ''}`}
        />
      </span>
      {help && (
        <span className="mt-1 block text-xs font-normal leading-4 text-muted-foreground">
          {help}
        </span>
      )}
    </label>
  )
}

function DaySchedule({
  day,
  label,
  schedule,
}: {
  day: number
  label: string
  schedule: BusinessDay
}) {
  const first = schedule.shifts[0]
  const second = schedule.shifts[1]
  return (
    <div className="grid gap-3 rounded-2xl border border-border bg-[#fbfcfe] p-3 sm:grid-cols-[130px_1fr_1fr] sm:items-center">
      <label className="flex items-center gap-2 text-sm font-extrabold">
        <input
          type="checkbox"
          name={`day-${day}-enabled`}
          defaultChecked={schedule.enabled}
          className="size-4 accent-primary"
        />
        {label}
      </label>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <input
          type="time"
          name={`day-${day}-start-1`}
          defaultValue={first?.start ?? '08:30'}
          aria-label={`${label}, apertura del primer turno`}
          className={input.replace('mt-2 ', '')}
        />
        <span className="text-xs font-bold text-muted-foreground">a</span>
        <input
          type="time"
          name={`day-${day}-end-1`}
          defaultValue={first?.end ?? '13:00'}
          aria-label={`${label}, cierre del primer turno`}
          className={input.replace('mt-2 ', '')}
        />
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <input
          type="time"
          name={`day-${day}-start-2`}
          defaultValue={second?.start ?? ''}
          aria-label={`${label}, apertura del segundo turno`}
          className={input.replace('mt-2 ', '')}
        />
        <span className="text-xs font-bold text-muted-foreground">a</span>
        <input
          type="time"
          name={`day-${day}-end-2`}
          defaultValue={second?.end ?? ''}
          aria-label={`${label}, cierre del segundo turno`}
          className={input.replace('mt-2 ', '')}
        />
      </div>
    </div>
  )
}

function ToggleCard({
  name,
  value,
  defaultChecked,
  icon: Icon,
  title,
  detail,
}: {
  name: string
  value?: string
  defaultChecked: boolean
  icon: typeof Truck
  title: string
  detail: string
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border p-4 transition hover:border-primary/30 hover:bg-primary/[0.025]">
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="mt-1 size-4 accent-primary"
      />
      <Icon className="mt-0.5 size-5 shrink-0 text-primary" />
      <span>
        <strong className="block text-sm">{title}</strong>
        <span className="mt-1 block text-xs leading-4 text-muted-foreground">
          {detail}
        </span>
      </span>
    </label>
  )
}
