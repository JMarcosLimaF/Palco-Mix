import { LogoBadge, LogoMark } from '@/components/brand/logo'
import { InstagramIcon, WhatsAppIcon } from '@/components/brand/social-icons'
import { buttonVariants } from '@/components/ui/button-variants'
import { site, whatsappLink } from '@/config/site'
import { Reveal } from './reveal'

const MESSAGE = 'Olá, Palco Mix! Vim pelo site e queria tirar uma dúvida sobre um produto.'

/** Bloco final de conversão: WhatsApp em destaque + selo oficial da loja. */
export function WhatsAppCta() {
  return (
    <section aria-labelledby="home-whatsapp" className="container-page pt-16 sm:pt-24">
      <Reveal>
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-ink-950 px-6 py-12 text-white ring-1 ring-black/5 sm:px-12 sm:py-16 lg:px-16 lg:py-20 dark:ring-white/[0.07]">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-[radial-gradient(55%_75%_at_85%_20%,rgb(0_102_255/0.42),transparent_70%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(45%_55%_at_0%_100%,rgb(37_211_102/0.12),transparent_70%)]" />
            <LogoMark className="absolute -bottom-[20%] -left-[8%] h-[115%] w-auto text-white opacity-[0.04]" />
          </div>

          <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            <div>
              <p className="eyebrow flex items-center gap-2 text-brand-300">
                <span aria-hidden className="h-px w-6 bg-current" />
                Atendimento direto
              </p>
              <h2 id="home-whatsapp" className="title-display mt-4 text-4xl text-balance sm:text-5xl lg:text-6xl">
                Viu algo que curtiu? <span className="text-brand-gradient inline-block pr-[0.1em]">Chama no Whats.</span>
              </h2>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-white/65 sm:text-lg">
                Mande o print ou o código do produto e fale direto com a Palco Mix sobre numeração, cores e
                disponibilidade.
              </p>
              <div className="mt-9 flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-7">
                <a
                  href={whatsappLink(MESSAGE)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: 'whatsapp', size: 'lg', className: 'h-14 px-8 text-base' })}
                >
                  <WhatsAppIcon />
                  Chamar no WhatsApp
                  <span className="sr-only"> (abre em nova aba)</span>
                </a>
                <p className="text-sm text-white/55">
                  ou salve o número
                  <span className="mt-0.5 block text-lg font-bold tracking-tight text-white tabular-nums">
                    {site.whatsapp.display}
                  </span>
                </p>
              </div>
            </div>

            <div className="relative mx-auto flex items-center justify-center pb-6 lg:mx-0 lg:justify-self-end">
              <div aria-hidden className="absolute inset-[-14%] rounded-full bg-brand-500/25 blur-3xl" />
              <LogoBadge size={320} className="relative size-44 sm:size-56 lg:size-64" />
              <a
                href={site.instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-0 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/10 px-4 py-2.5 text-sm font-semibold whitespace-nowrap text-white ring-1 ring-white/15 backdrop-blur-md transition-colors duration-300 hover:bg-white/20 focus-visible:outline-white"
              >
                <InstagramIcon className="size-4" />@{site.instagram.handle}
                <span className="sr-only"> no Instagram (abre em nova aba)</span>
              </a>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
