const deduplicateWork = require('./lib/deduplicate_works')

const sanitization = {
  uri: {},
  isbn: {}
}

const controller = async ({ uri, isbn, reqUserId }) => {
  const tasks = await deduplicateWork(uri, isbn, reqUserId)
  return {
    tasks: (tasks || []).flat()
  }
}

module.exports = { sanitization, controller }
