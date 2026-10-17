/**
 * Textos (pt-BR, com gênero correto) e opções de cada tipo de taxonomia.
 */
import type { TaxonomyKind, TaxonomySort } from './types'

export interface TaxonomyCopy {
  /** "Categorias" */
  title: string
  /** "categoria" */
  singular: string
  /** "categorias" */
  plural: string
  /** "Nova categoria" */
  newLabel: string
  /** "Editar categoria" */
  editTitle: string
  /** rótulo do botão de envio ao criar */
  createSubmit: string
  pageDescription: string
  /** descrição do modal ao criar */
  newDescription: string
  namePlaceholder: string
  descriptionPlaceholder: string
  /** rótulo acessível do campo de busca */
  searchLabel: string
  searchPlaceholder: string
  /** versão curta para o celular (o campo tem fonte de 16px e ~270px úteis) */
  searchPlaceholderShort: string
  emptyTitle: string
  emptyDescription: string
  /** "Criada" | "Criado" */
  createdLabel: string
  /** particípios usados nos toasts */
  created: string
  updated: string
  deleted: string
  /** "esta" | "este" */
  demonstrative: string
  /** "outra" | "outro" */
  other: string
  /** sufixo do contador no título: ["cadastrada", "cadastradas"] */
  registered: readonly [string, string]
  nameRequired: string
  nameTaken: string
  /** placeholder do seletor de destino ao excluir com produtos */
  selectTarget: string
  /** texto da coluna/rótulo do identificador */
  idHint: string
}

export const TAXONOMY_COPY: Record<TaxonomyKind, TaxonomyCopy> = {
  categories: {
    title: 'Categorias',
    singular: 'categoria',
    plural: 'categorias',
    newLabel: 'Nova categoria',
    editTitle: 'Editar categoria',
    createSubmit: 'Criar categoria',
    pageDescription:
      'Organize o catálogo por tipo de produto. Cada categoria vira um filtro na vitrine e agrupa os produtos.',
    newDescription: 'Use um nome curto e claro — ele aparece nos filtros e nos cards da vitrine.',
    namePlaceholder: 'Ex.: Tênis, Sandálias, Bolsas',
    descriptionPlaceholder: 'Uma frase curta sobre o que a pessoa encontra aqui.',
    searchLabel: 'Buscar categorias',
    searchPlaceholder: 'Buscar por nome ou descrição',
    searchPlaceholderShort: 'Nome ou descrição',
    emptyTitle: 'Nenhuma categoria cadastrada',
    emptyDescription: 'Crie a primeira categoria para organizar os produtos e os filtros da vitrine.',
    createdLabel: 'Criada',
    created: 'criada',
    updated: 'atualizada',
    deleted: 'excluída',
    demonstrative: 'esta',
    other: 'outra',
    registered: ['cadastrada', 'cadastradas'],
    nameRequired: 'Informe o nome da categoria.',
    nameTaken: 'Já existe uma categoria com esse nome.',
    selectTarget: 'Selecione a categoria de destino',
    idHint: 'usado nos links da loja (ex.: /catalogo?categoria=…)',
  },
  distributors: {
    title: 'Distribuidores',
    singular: 'distribuidor',
    plural: 'distribuidores',
    newLabel: 'Novo distribuidor',
    editTitle: 'Editar distribuidor',
    createSubmit: 'Criar distribuidor',
    pageDescription:
      'Marcas e fornecedores do catálogo. O nome aparece nos filtros e nos cards da vitrine; os contatos ficam à mão aqui.',
    newDescription: 'Cadastre a marca ou o fornecedor. Os dados de contato são opcionais.',
    namePlaceholder: 'Ex.: Pegada, Modare',
    descriptionPlaceholder: 'Linhas, estilos ou observações sobre a marca.',
    searchLabel: 'Buscar distribuidores',
    searchPlaceholder: 'Buscar por nome, descrição ou contato',
    searchPlaceholderShort: 'Nome, descrição ou contato',
    emptyTitle: 'Nenhum distribuidor cadastrado',
    emptyDescription: 'Cadastre a primeira marca ou fornecedor para vincular aos produtos.',
    createdLabel: 'Criado',
    created: 'criado',
    updated: 'atualizado',
    deleted: 'excluído',
    demonstrative: 'este',
    other: 'outro',
    registered: ['cadastrado', 'cadastrados'],
    nameRequired: 'Informe o nome do distribuidor.',
    nameTaken: 'Já existe um distribuidor com esse nome.',
    selectTarget: 'Selecione o distribuidor de destino',
    idHint: 'usado nos links da loja (ex.: /catalogo?distribuidor=…)',
  },
}

export interface TaxonomySortOption {
  value: TaxonomySort
  label: string
  /** rótulo curto para telas estreitas */
  short: string
}

export const TAXONOMY_SORT_OPTIONS: readonly TaxonomySortOption[] = [
  { value: 'name', label: 'Nome A–Z', short: 'A–Z' },
  { value: 'usage', label: 'Mais produtos', short: 'Produtos' },
  { value: 'recent', label: 'Mais recentes', short: 'Recentes' },
]

/** Limites de tamanho dos campos de texto. */
export const NAME_MAX = 60
export const DESCRIPTION_MAX = 240
