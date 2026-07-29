'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import type { Product } from '@/lib/types'
import { useToast } from './toast-provider'

export interface CartItem {
  key: string
  product: Product
  variantId?: string
  variantLabel?: string
  saleMode?: 'package' | 'kg'
  unitPrice: number
  quantity: number
  savedForLater?: boolean
}

interface StoreContextValue {
  items: CartItem[]
  favorites: string[]
  cartCount: number
  cartAnimationId: number
  subtotal: number
  isCartOpen: boolean
  openCart: () => void
  closeCart: () => void
  addToCart: (
    product: Product,
    opts?: {
      variantId?: string
      variantLabel?: string
      saleMode?: 'package' | 'kg'
      unitPrice?: number
      quantity?: number
    },
  ) => void
  removeFromCart: (key: string) => void
  updateQuantity: (key: string, quantity: number) => void
  toggleSaveForLater: (key: string) => void
  clearCart: () => void
  toggleFavorite: (productId: string) => void
  isFavorite: (productId: string) => boolean
}

const StoreContext = createContext<StoreContextValue | null>(null)

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const [cartAnimationId, setCartAnimationId] = useState(0)
  const [isCartOpen, setCartOpen] = useState(false)
  const { toast } = useToast()

  const openCart = useCallback(() => setCartOpen(true), [])
  const closeCart = useCallback(() => setCartOpen(false), [])

  const addToCart = useCallback<StoreContextValue['addToCart']>(
    (product, opts = {}) => {
      const {
        variantId = product.defaultVariantId,
        variantLabel,
        saleMode = product.defaultSaleMode,
        unitPrice,
        quantity = 1,
      } = opts
      const key = product.id + (variantId ? '::' + variantId : '')
      setItems((prev) => {
        const existing = prev.find((i) => i.key === key && !i.savedForLater)
        if (existing) {
          return prev.map((i) =>
            i.key === key ? { ...i, quantity: i.quantity + quantity } : i,
          )
        }
        return [
          ...prev,
          {
            key,
            product,
            variantId,
            variantLabel,
            saleMode,
            unitPrice: unitPrice ?? product.price,
            quantity,
          },
        ]
      })
      setCartAnimationId((current) => current + 1)
      setTimeout(() => toast('Producto agregado al carrito', 'success'), 0)
    },
    [toast],
  )

  const removeFromCart = useCallback((key: string) => {
    setItems((prev) => prev.filter((i) => i.key !== key))
  }, [])

  const updateQuantity = useCallback((key: string, quantity: number) => {
    if (quantity < 1) return
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, quantity } : i)))
  }, [])

  const toggleSaveForLater = useCallback((key: string) => {
    setItems((prev) =>
      prev.map((i) => (i.key === key ? { ...i, savedForLater: !i.savedForLater } : i)),
    )
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const toggleFavorite = useCallback(
    (productId: string) => {
      const has = favorites.includes(productId)
      setFavorites((prev) =>
        has ? prev.filter((id) => id !== productId) : [...prev, productId],
      )
    },
    [favorites],
  )

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites])

  const activeItems = items.filter((i) => !i.savedForLater)
  const cartCount = activeItems.reduce((n, i) => n + i.quantity, 0)
  const subtotal = activeItems.reduce((n, i) => n + i.unitPrice * i.quantity, 0)

  const value = useMemo<StoreContextValue>(
    () => ({
      items,
      favorites,
      cartCount,
      cartAnimationId,
      subtotal,
      isCartOpen,
      openCart,
      closeCart,
      addToCart,
      removeFromCart,
      updateQuantity,
      toggleSaveForLater,
      clearCart,
      toggleFavorite,
      isFavorite,
    }),
    [
      items,
      favorites,
      cartCount,
      cartAnimationId,
      subtotal,
      isCartOpen,
      openCart,
      closeCart,
      addToCart,
      removeFromCart,
      updateQuantity,
      toggleSaveForLater,
      clearCart,
      toggleFavorite,
      isFavorite,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
