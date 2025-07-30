import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { CartItem } from "@/types"

interface CartStore {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (id: string, variantId?: string) => void
  updateQuantity: (id: string, quantity: number, variantId?: string) => void
  clearCart: () => void
  getSubtotal: () => number
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item) => {
        set((state) => {
          const existingItem = state.items.find(
            (i) => i.id === item.id && i.variantId === item.variantId
          )

          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.id === item.id && i.variantId === item.variantId
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            }
          }

          return {
            items: [...state.items, { ...item, quantity: 1 }],
          }
        })
      },

      removeItem: (id, variantId) => {
        set((state) => ({
          items: state.items.filter(
            (item) => !(item.id === id && item.variantId === variantId)
          ),
        }))
      },

      updateQuantity: (id, quantity, variantId) => {
        if (quantity < 1) return
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id && item.variantId === variantId
              ? { ...item, quantity }
              : item
          ),
        }))
      },

      clearCart: () => set({ items: [] }),

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0)
      },
    }),
    {
      name: 'shopping-cart',
      storage: createJSONStorage(() => {
        try {
          return localStorage
        } catch (error) {
          console.warn('localStorage not available, using memory storage')
          // Fallback to memory storage if localStorage fails
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {}
          }
        }
      }),
      partialize: (state) => ({ items: state.items }),
      version: 1,
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Cart rehydration error:', error)
          return
        }
        
        if (state && Array.isArray(state.items)) {
          console.log('Handlekurv gjenopprettet:', state.items.length, 'produkter')
        } else {
          console.warn('Ugyldig handlekurvdata, tilbakestiller')
          if (state?.clearCart) {
            state.clearCart()
          }
        }
      },
      skipHydration: false,
    }
  )
) 