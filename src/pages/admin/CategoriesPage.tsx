import { CategoryFields } from '@/components/admin/taxonomy/category-fields'
import { CategoryGrid, CategoryGridSkeleton } from '@/components/admin/taxonomy/category-grid'
import { categoryForm } from '@/components/admin/taxonomy/forms'
import { TaxonomyManager } from '@/components/admin/taxonomy/taxonomy-manager'
import { useCategories, useCategoryUsage, useDeleteCategory, useSaveCategory } from '@/hooks/catalog'
import { useDocumentTitle } from '@/hooks/use-document-title'

/** Admin · Categorias — grade de cards com capa. */
export default function CategoriesPage() {
  useDocumentTitle('Categorias · Admin')
  const list = useCategories()
  const usage = useCategoryUsage()
  const save = useSaveCategory()
  const remove = useDeleteCategory()

  return (
    <TaxonomyManager
      kind="categories"
      list={list}
      usage={usage}
      save={save}
      remove={remove}
      form={categoryForm}
      renderFields={(props) => <CategoryFields {...props} />}
      renderList={(props) => <CategoryGrid {...props} />}
      renderSkeleton={() => <CategoryGridSkeleton />}
    />
  )
}
