import tasks_ from './lib/tasks.js'

const sanitization = {
  uris: {}
}

const byEntityUris = fnName => ({
  sanitization,
  controller: async ({ uris }) => {
    const tasks = await tasks_[fnName](uris, { index: true })
    return { tasks }
  }
})

export default {
  bySuspectUris: byEntityUris('bySuspectUris'),
  bySuggestionUris: byEntityUris('bySuggestionUris')
}
