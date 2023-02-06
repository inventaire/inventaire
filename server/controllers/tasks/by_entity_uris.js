import { getTasksBySuspectUris, getTasksBySuggestionUris } from './lib/tasks.js'

const sanitization = {
  uris: {},
}

export const bySuspectUris = {
  sanitization,
  controller: async ({ uris }) => {
    const tasks = await getTasksBySuspectUris(uris, { index: true })
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
