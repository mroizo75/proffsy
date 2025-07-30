"use client"

import { useCart } from "@/lib/hooks/use-cart"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function TestCartPage() {
  const { items, addItem, clearCart } = useCart()
  
  const testAddItem = () => {
    console.log('🧪 Test button clicked')
    
    const testItem = {
      id: "test-123",
      name: "Test Produkt",
      price: 99.99,
      image: "",
      stock: 10
    }
    
    console.log('🧪 Adding test item:', testItem)
    addItem(testItem)
    console.log('🧪 Test item added')
    toast.success("Test item lagt til!")
  }
  
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-4">Cart Test Side</h1>
      
      <div className="space-y-4">
        <Button onClick={testAddItem} className="mr-4">
          Legg til test produkt
        </Button>
        
        <Button onClick={() => clearCart()} variant="destructive">
          Tøm handlekurv
        </Button>
        
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-2">Handlekurv innhold:</h2>
          <pre className="bg-gray-100 p-4 rounded">
            {JSON.stringify(items, null, 2)}
          </pre>
          <p className="mt-2">Antall produkter: {items.length}</p>
        </div>
      </div>
    </div>
  )
}