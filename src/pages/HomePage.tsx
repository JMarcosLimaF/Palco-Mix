/**
 * Página inicial. Importada de forma síncrona pelo router (LCP): aqui fica só
 * o hero; as seções abaixo da dobra vêm em um chunk separado.
 */
import { lazy, Suspense } from 'react'
import { HeroCarousel } from '@/components/home/hero-carousel'
import { site } from '@/config/site'
import { useDocumentTitle } from '@/hooks/use-document-title'

const HomeSections = lazy(() => import('@/components/home/home-sections'))

export default function HomePage() {
  useDocumentTitle()

  return (
    <>
      <h1 className="sr-only">{site.fullName}</h1>
      <HeroCarousel />
      <Suspense fallback={<div aria-hidden className="min-h-[60svh]" />}>
        <HomeSections />
      </Suspense>
    </>
  )
}
