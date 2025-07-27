"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Slider } from "@/components/ui/slider"
import { useEffect, useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"

interface Category {
  id: string
  name: string
  slug: string
}

interface ProductFiltersProps {
  categories: Category[]
}

export function ProductFilters({ categories }: ProductFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [priceRange, setPriceRange] = useState([0, 10000])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  useEffect(() => {
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const category = searchParams.get('category')

    if (minPrice && maxPrice) {
      setPriceRange([parseInt(minPrice), parseInt(maxPrice)])
    }
    if (category) {
      setSelectedCategories(category.split(','))
    }
  }, [searchParams])

  function handlePriceChange(values: number[]) {
    const params = new URLSearchParams(searchParams)
    params.set('minPrice', values[0].toString())
    params.set('maxPrice', values[1].toString())
    router.push(`/products?${params.toString()}`)
  }

  function handleCategoryChange(categorySlug: string) {
    const params = new URLSearchParams(searchParams)
    const newCategories = selectedCategories.includes(categorySlug)
      ? selectedCategories.filter(c => c !== categorySlug)
      : [...selectedCategories, categorySlug]
    
    setSelectedCategories(newCategories)
    
    if (newCategories.length > 0) {
      params.set('category', newCategories.join(','))
    } else {
      params.delete('category')
    }
    
    router.push(`/products?${params.toString()}`)
  }

  function clearFilters() {
    setSelectedCategories([])
    setPriceRange([0, 10000])
    router.push('/products')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filtrer</h3>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={clearFilters}
        >
          Nullstill
        </Button>
      </div>
      
      <Accordion type="multiple" className="w-full space-y-4">
        <AccordionItem value="categories">
          <AccordionTrigger>Kategorier</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pt-1">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={category.slug}
                    checked={selectedCategories.includes(category.slug)}
                    onCheckedChange={() => handleCategoryChange(category.slug)}
                  />
                  <label
                    htmlFor={category.slug}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {category.name}
                  </label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="price">
          <AccordionTrigger>Pris</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <Slider
                min={0}
                max={10000}
                step={100}
                value={priceRange}
                onValueChange={setPriceRange}
                onValueCommit={handlePriceChange}
              />
              <div className="flex items-center justify-between">
                <span>{priceRange[0]} kr</span>
                <span>{priceRange[1]} kr</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
} 