import useSWR, { mutate as globalMutate } from "swr"

interface Category {
  id: string
  name: string
  slug: string
  description?: string
}

const CATEGORIES_KEY = "/api/admin/categories"

export function useCategories() {
  const { data, error, isLoading, mutate } = useSWR<Category[]>(
    CATEGORIES_KEY,
    async (url) => {
      const res = await fetch(url)
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Ikke autorisert")
        }
        throw new Error("Feil ved henting av kategorier")
      }
      return res.json()
    },
    {
      revalidateOnMount: true,
      revalidateOnFocus: false
    }
  )

  return {
    categories: data || [],
    isLoading,
    isError: error,
    mutate: async () => {
      await mutate()
    }
  }
}

// Helper for å oppdatere kategorier fra andre komponenter
export const mutateCategories = () => globalMutate(CATEGORIES_KEY) 