/**
 * Modal e Drawer acessíveis (Radix Dialog: foco preso, Esc, bloqueio de scroll,
 * aria completos) com animações Motion.
 *
 * No celular o Modal vira "bottom sheet" (desliza de baixo) automaticamente.
 */
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import type { ReactNode } from 'react'
import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'

const EASE = [0.16, 1, 0.3, 1] as const

const SIZES = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
  '2xl': 'sm:max-w-6xl',
} as const

export interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Obrigatório por acessibilidade; use hideHeader para ocultar visualmente. */
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  size?: keyof typeof SIZES
  /** Oculta o cabeçalho visual (título continua disponível a leitores de tela). */
  hideHeader?: boolean
  className?: string
  bodyClassName?: string
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
  hideHeader = false,
  className,
  bodyClassName,
}: ModalProps) {
  const isDesktop = useMediaQuery('(min-width: 640px)')
  const motionProps = isDesktop
    ? {
        initial: { opacity: 0, scale: 0.96, y: 12 },
        animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.35, ease: EASE } },
        exit: { opacity: 0, scale: 0.97, y: 8, transition: { duration: 0.18 } },
      }
    : {
        initial: { y: '100%' },
        animate: { y: 0, transition: { duration: 0.4, ease: EASE } },
        exit: { y: '100%', transition: { duration: 0.25, ease: [0.4, 0, 1, 1] as const } },
      }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <m.div
                className="fixed inset-0 z-50 bg-overlay backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </Dialog.Overlay>
            <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
              <Dialog.Content asChild forceMount>
                <m.div
                  {...motionProps}
                  className={cn(
                    'pointer-events-auto relative flex max-h-[92dvh] w-full flex-col overflow-hidden bg-elevated text-fg shadow-pop',
                    'rounded-t-3xl sm:max-h-[min(90dvh,56rem)] sm:rounded-3xl',
                    'ring-1 ring-black/5 dark:ring-white/10',
                    SIZES[size],
                    className,
                  )}
                >
                  {/* alça do bottom sheet */}
                  <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-line-strong sm:hidden" aria-hidden />
                  {hideHeader ? (
                    <>
                      <Dialog.Title className="sr-only">{title}</Dialog.Title>
                      {/* sem descrição não há Description: o Radix omite o aria-describedby (não repete o título) */}
                      {description && <Dialog.Description className="sr-only">{description}</Dialog.Description>}
                    </>
                  ) : (
                    <div className="flex shrink-0 items-start justify-between gap-4 px-5 pt-4 pb-2 sm:px-6 sm:pt-6">
                      <div className="min-w-0">
                        <Dialog.Title className="text-lg font-bold tracking-tight">{title}</Dialog.Title>
                        {description && (
                          <Dialog.Description className="mt-1 text-sm text-muted">{description}</Dialog.Description>
                        )}
                      </div>
                    </div>
                  )}
                  <Dialog.Close
                    className="absolute top-2.5 right-2.5 z-10 inline-flex size-11 items-center justify-center rounded-full bg-elevated/80 text-muted backdrop-blur transition hover:bg-surface-2 hover:text-fg sm:top-4 sm:right-4 sm:size-9"
                    aria-label="Fechar"
                  >
                    <X className="size-[1.1rem]" />
                  </Dialog.Close>
                  <div className={cn('min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 sm:px-6 sm:pb-6', bodyClassName)}>
                    {children}
                  </div>
                  {footer && (
                    <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-line bg-surface/60 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-6">
                      {footer}
                    </div>
                  )}
                </m.div>
              </Dialog.Content>
            </div>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}

export interface DrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  side?: 'left' | 'right'
  children?: ReactNode
  footer?: ReactNode
  className?: string
}

export function Drawer({ open, onOpenChange, title, description, side = 'right', children, footer, className }: DrawerProps) {
  const offset = side === 'right' ? '100%' : '-100%'
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <m.div
                className="fixed inset-0 z-50 bg-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount>
              <m.div
                initial={{ x: offset }}
                animate={{ x: 0, transition: { duration: 0.4, ease: EASE } }}
                exit={{ x: offset, transition: { duration: 0.22, ease: [0.4, 0, 1, 1] } }}
                className={cn(
                  'fixed top-0 bottom-0 z-50 flex w-[min(24rem,88vw)] flex-col bg-elevated text-fg shadow-pop',
                  side === 'right' ? 'right-0' : 'left-0',
                  className,
                )}
              >
                <div className="flex shrink-0 items-center justify-between gap-4 border-b border-line px-5 py-4">
                  <div className="min-w-0">
                    <Dialog.Title className="text-base font-bold tracking-tight">{title}</Dialog.Title>
                    {description && (
                      <Dialog.Description className="mt-0.5 text-xs text-muted">{description}</Dialog.Description>
                    )}
                  </div>
                  <Dialog.Close
                    className="inline-flex size-11 items-center justify-center rounded-full text-muted transition hover:bg-surface-2 hover:text-fg sm:size-9"
                    aria-label="Fechar"
                  >
                    <X className="size-[1.1rem]" />
                  </Dialog.Close>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">{children}</div>
                {footer && (
                  <div className="flex shrink-0 gap-2 border-t border-line px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                    {footer}
                  </div>
                )}
              </m.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
