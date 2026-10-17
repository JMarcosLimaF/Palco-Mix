import { Panel } from '@/components/admin/ui'
import { Skeleton } from '@/components/ui/feedback'

/** Esqueleto do formulário de produto (carregando para edição). */
export function ProductFormSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy aria-label="Carregando produto">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-9 w-64 rounded-xl" />
        <Skeleton className="h-5 w-48 rounded-full" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {[3, 2, 4].map((fields, i) => (
            <Panel key={i}>
              <div className="border-b border-line px-5 py-4">
                <Skeleton className="h-4 w-28 rounded-full" />
                <Skeleton className="mt-2 h-3 w-56 rounded-full" />
              </div>
              <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
                {Array.from({ length: fields }, (_, j) => (
                  <div key={j} className={j === 0 && fields === 3 ? 'sm:col-span-2' : undefined}>
                    <Skeleton className="h-3.5 w-24 rounded-full" />
                    <Skeleton className="mt-2.5 h-11 w-full" />
                  </div>
                ))}
              </div>
            </Panel>
          ))}
        </div>
        <div className="hidden flex-col gap-6 lg:flex">
          <Panel className="p-5">
            <Skeleton className="h-4 w-32 rounded-full" />
            <Skeleton className="mx-auto mt-5 aspect-[5/6] w-full max-w-[17rem] rounded-2xl" />
            <Skeleton className="mx-auto mt-3 h-3 w-1/3 max-w-[17rem] rounded-full" />
            <Skeleton className="mx-auto mt-2 h-4 w-2/3 max-w-[17rem] rounded-full" />
          </Panel>
          <Panel className="p-5">
            <Skeleton className="h-4 w-24 rounded-full" />
            <Skeleton className="mt-5 h-6 w-3/4 rounded-full" />
            <Skeleton className="mt-4 h-6 w-2/3 rounded-full" />
          </Panel>
        </div>
      </div>
    </div>
  )
}
