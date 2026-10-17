import { useQuery } from '@tanstack/react-query'
import { catalogKeys } from '@/hooks/catalog'
import { adminService } from '@/services/admin'

/**
 * Métricas do painel. Fica no admin (e não em `@/hooks/catalog`) para o
 * `adminService` não entrar no bundle público. Mesma chave → mesmo cache.
 */
export function useDashboardStats() {
  return useQuery({ queryKey: catalogKeys.stats, queryFn: () => adminService.stats() })
}
