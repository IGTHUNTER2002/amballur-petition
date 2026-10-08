import { useQuery } from '@tanstack/react-query'
import { getPublishedPetition } from '../services/petition-service'

export function usePublicPetition() {
  return useQuery({
    queryKey: ['published-petition'],
    queryFn: getPublishedPetition,
    staleTime: 60_000,
  })
}
