import { useQuery } from '@tanstack/react-query'
import barangayGeoJSON from '@/data/barangay.json'

export function useBarangayGeoJSON() {
  return useQuery({
    queryKey: ['barangay-geojson'],
    queryFn: async () => {
      // Return the imported GeoJSON data
      return barangayGeoJSON
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  })
}
