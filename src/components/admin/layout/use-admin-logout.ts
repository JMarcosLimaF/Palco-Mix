import { useCallback } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth'

/** Encerra a sessão, volta ao login e avisa com um toast. */
export function useAdminLogout() {
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  return useCallback(() => {
    logout()
    void navigate('/admin', { replace: true })
    toast.success('Você saiu do painel.', { description: 'Até a próxima!' })
  }, [logout, navigate])
}
