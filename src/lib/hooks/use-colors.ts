import useSWR, { mutate } from "swr"

const COLORS_KEY = "/api/admin/colors"

export function useColors(options = {}) {
  const { data: colors = [], error, isLoading, mutate } = useSWR<any[]>(
    "/api/admin/colors",
    async (url) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch colors')
      return res.json()
    },
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      ...options
    }
  )

  return {
    colors,
    isLoading,
    isError: error,
    mutate
  }
}

// Helper for å oppdatere farger fra andre komponenter
export const mutateColors = () => mutate(COLORS_KEY) 