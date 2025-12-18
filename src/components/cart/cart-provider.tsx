"use client"

import { createContext, useContext, useReducer, useEffect } from "react"
import { toast } from "sonner"

interface CartItem {
  id: string
  name: string
  price: number
  image?: string
  quantity: number
}

interface CartState {
  items: CartItem[]
  total: number
}

type CartAction =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "UPDATE_QUANTITY"; payload: { id: string; quantity: number } }
  | { type: "CLEAR_CART" }
  | { type: "LOAD_CART"; payload: CartState }

const CartContext = createContext<{
  state: CartState
  dispatch: React.Dispatch<CartAction>
} | null>(null)

const CART_STORAGE_KEY = "proffsy-cart"

function cartReducer(state: CartState, action: CartAction): CartState {
  let newState: CartState

  switch (action.type) {
    case "ADD_ITEM": {
      const existingItem = state.items.find(item => item.id === action.payload.id)
      
      if (existingItem) {
        newState = {
          ...state,
          items: state.items.map(item =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
          total: Number(state.total) + Number(action.payload.price)
        }
      } else {
        newState = {
          ...state,
          items: [...state.items, action.payload],
          total: Number(state.total) + Number(action.payload.price)
        }
      }
      break
    }
    case "REMOVE_ITEM": {
      const item = state.items.find(item => item.id === action.payload)
      newState = {
        ...state,
        items: state.items.filter(item => item.id !== action.payload),
        total: state.total - (item ? item.price * item.quantity : 0)
      }
      break
    }
    case "UPDATE_QUANTITY": {
      const item = state.items.find(item => item.id === action.payload.id)
      if (!item) return state

      const quantityDiff = action.payload.quantity - item.quantity
      newState = {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
        total: state.total + (item.price * quantityDiff)
      }
      break
    }
    case "CLEAR_CART": {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(CART_STORAGE_KEY)
      }
      return { items: [], total: 0 }
    }
    case "LOAD_CART":
      newState = action.payload
      break
    default:
      return state
  }

  // Lagre til localStorage ved endringer
  if (state.items.length > 0) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newState))
    }
  }

  return newState
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], total: 0 })

  // Last handlekurv fra localStorage ved oppstart
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY)
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart)
        dispatch({ type: "LOAD_CART", payload: parsedCart })
      } catch (error) {
        localStorage.removeItem(CART_STORAGE_KEY)
      }
    }
  }, [])

  // Lagre til localStorage ved endringer
  useEffect(() => {
    if (state.items.length > 0) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state))
    }
  }, [state])

  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
} 