import { DistributorFields } from '@/components/admin/taxonomy/distributor-fields'
import { DistributorList, DistributorListSkeleton } from '@/components/admin/taxonomy/distributor-list'
import { distributorForm } from '@/components/admin/taxonomy/forms'
import { distributorSearchText } from '@/components/admin/taxonomy/logic'
import { TaxonomyManager } from '@/components/admin/taxonomy/taxonomy-manager'
import { useDeleteDistributor, useDistributors, useDistributorUsage, useSaveDistributor } from '@/hooks/catalog'
import { useDocumentTitle } from '@/hooks/use-document-title'

/** Admin · Distribuidores — tabela (desktop) / cards (celular) com contatos. */
export default function DistributorsPage() {
  useDocumentTitle('Distribuidores · Admin')
  const list = useDistributors()
  const usage = useDistributorUsage()
  const save = useSaveDistributor()
  const remove = useDeleteDistributor()

  return (
    <TaxonomyManager
      kind="distributors"
      list={list}
      usage={usage}
      save={save}
      remove={remove}
      form={distributorForm}
      searchText={distributorSearchText}
      renderFields={(props) => <DistributorFields {...props} />}
      renderList={(props) => <DistributorList {...props} />}
      renderSkeleton={() => <DistributorListSkeleton />}
    />
  )
}
