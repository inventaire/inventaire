import { isVisibilityGroupKey } from '#lib/boolean_validations'

export interface PageParams {
  limit: number
  offset?: number
  context?: string
}

export function paginate <T> (collection: T[], params: PageParams) {
  const { limit, offset = 0, context } = params
  collection = collection.sort(byCreationDate)
  if (context != null) {
    collection = collection.filter(canBeDisplayedInContext(context))
  }
  const total = collection.length
  const last = offset + limit

  return {
    page: collection.slice(offset, last),
    total,
    offset,
    context,
    continue: (last < total) ? last : undefined,
  }
}

const byCreationDate = (a, b) => b.created - a.created

const canBeDisplayedInContext = context => item => {
  if (isVisibilityGroupKey(context)) {
    const { visibility } = item
    if (visibility.includes('public') || visibility.includes('groups') || visibility.includes(context)) {
      return true
    } else {
      return false
    }
  } else {
    return true
  }
}
