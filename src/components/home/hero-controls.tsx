import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import { useEffect, useEffectEvent, useRef } from 'react'
import { cn } from '@/lib/utils'
import { AUTOPLAY_MS, GLASS_BUTTON, padIndex, slideLabel, type HeroSlide } from './hero-shared'

interface AutoplayProgressProps {
  playing: boolean
  onComplete: () => void
}

/**
 * Preenchimento da pílula ativa. A própria animação (Web Animations API, só
 * `transform`) é o relógio do autoplay: pausa/retoma junto com ele e avança o
 * slide ao terminar — sem timers paralelos nem re-render por quadro.
 */
function AutoplayProgress({ playing, onComplete }: AutoplayProgressProps) {
  const barRef = useRef<HTMLSpanElement>(null)
  const animationRef = useRef<Animation | null>(null)
  const complete = useEffectEvent(onComplete)

  useEffect(() => {
    const bar = barRef.current
    if (!bar || typeof bar.animate !== 'function') return
    const animation = bar.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], {
      duration: AUTOPLAY_MS,
      easing: 'linear',
      fill: 'forwards',
    })
    animation.pause()
    animation.onfinish = () => complete()
    animationRef.current = animation
    return () => {
      animation.onfinish = null
      animation.cancel()
      animationRef.current = null
    }
  }, [])

  useEffect(() => {
    const animation = animationRef.current
    if (!animation) return
    if (playing) animation.play()
    else animation.pause()
  }, [playing])

  return <span ref={barRef} aria-hidden className="absolute inset-0 origin-left scale-x-0 rounded-full bg-white" />
}

export interface HeroControlsProps {
  slides: readonly HeroSlide[]
  active: number
  /** autoplay disponível (mais de um slide e sem "reduzir movimento") */
  canAutoplay: boolean
  /** autoplay correndo agora */
  playing: boolean
  userPaused: boolean
  controlsId: string
  onSelect: (index: number) => void
  onPrev: () => void
  onNext: () => void
  onTogglePause: () => void
  onAutoplayComplete: () => void
}

export function HeroControls({
  slides,
  active,
  canAutoplay,
  playing,
  userPaused,
  controlsId,
  onSelect,
  onPrev,
  onNext,
  onTogglePause,
  onAutoplayComplete,
}: HeroControlsProps) {
  const count = slides.length
  return (
    <div className="relative z-20 flex items-center justify-between gap-3 px-4 pt-2 pb-3 sm:px-10 sm:pt-5 sm:pb-7 lg:px-14 lg:pt-4 lg:pb-9">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        {canAutoplay && (
          <button
            type="button"
            onClick={onTogglePause}
            aria-label={userPaused ? 'Retomar apresentação automática' : 'Pausar apresentação automática'}
            className={GLASS_BUTTON}
          >
            {userPaused ? <Play aria-hidden className="translate-x-px" /> : <Pause aria-hidden />}
          </button>
        )}
        <div role="group" aria-label="Escolher destaque" className="flex min-w-0 items-center">
          {slides.map((slide, i) => {
            const isActive = i === active
            return (
              <button
                key={slide.key}
                type="button"
                onClick={() => onSelect(i)}
                aria-label={`Destaque ${i + 1} de ${count}: ${slideLabel(slide)}`}
                aria-current={isActive ? 'true' : undefined}
                aria-controls={controlsId}
                // no celular não há setas, só os pontos e o swipe: alvos de 28×44px (≥ 24px, WCAG 2.5.8)
                className="group/dot flex h-11 min-w-7 cursor-pointer items-center justify-center px-[11px] focus-visible:outline-white sm:h-10 sm:min-w-6 sm:px-[9px]"
              >
                <span
                  className={cn(
                    'relative block h-1.5 overflow-hidden rounded-full transition-[width,background-color] duration-500 ease-out-expo',
                    isActive ? 'w-9 bg-white/20 sm:w-12' : 'w-1.5 bg-white/30 group-hover/dot:bg-white/70',
                  )}
                >
                  {isActive &&
                    (canAutoplay ? (
                      <AutoplayProgress playing={playing} onComplete={onAutoplayComplete} />
                    ) : (
                      <span aria-hidden className="absolute inset-0 rounded-full bg-white" />
                    ))}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-4">
        <p aria-hidden className="hidden text-sm font-medium text-white/40 tabular-nums md:block">
          <span className="text-white">{padIndex(active + 1)}</span>
          <span className="mx-1.5">/</span>
          {padIndex(count)}
        </p>
        <div className="hidden items-center gap-2 sm:flex">
          <button
            type="button"
            onClick={onPrev}
            aria-label="Destaque anterior"
            aria-controls={controlsId}
            className={GLASS_BUTTON}
          >
            <ChevronLeft aria-hidden />
          </button>
          <button
            type="button"
            onClick={onNext}
            aria-label="Próximo destaque"
            aria-controls={controlsId}
            className={GLASS_BUTTON}
          >
            <ChevronRight aria-hidden />
          </button>
        </div>
      </div>
    </div>
  )
}
