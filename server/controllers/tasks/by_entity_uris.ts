import { forceArray } from '#lib/utils/base'
import { getTasksBySuspectUrisAndType, getTasksBySuggestionUris } from './lib/tasks.js'

const typeAllowList = [ 'deduplicate' ]

const sanitization = {
  uris: {},
  type: {
    allowlist: typeAllowList,
    optional: true,
  },
}

export const bySuspectUris = {
  sanitization,
  controller: async ({ uris, type = typeAllowList }) => {
    const types = forceArray(type)
    const tasks = await getTasksBySuspectUrisAndType(uris, types)
    return { tasks }
  },
}

export const bySuggestionUris = {
  sanitization,
  controller: async ({ uris }) => {
    const tasks = await getTasksBySuggestionUris(uris, { index: true })
    return { tasks }
  },
}
