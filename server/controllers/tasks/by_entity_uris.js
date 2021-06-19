const tasks_ = require('./lib/tasks')

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

module.exports = {
  bySuspectUris: byEntityUris('bySuspectUris'),
  bySuggestionUris: byEntityUris('bySuggestionUris')
}
