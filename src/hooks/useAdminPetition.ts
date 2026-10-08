import { useQuery } from '@tanstack/react-query'
import { getAdminPetition } from '../services/admin-service'

export function useAdminPetition() {
  return useQuery({
    queryKey: ['admin-petition'],
    queryFn: getAdminPetition,
  })
}
