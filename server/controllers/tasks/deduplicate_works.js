const _ = require('builders/utils')
const deduplicateWork = require('./lib/deduplicate_works')

const sanitization = {
  uri: {},
  isbn: {}
}

const controller = async ({ uri, isbn, reqUserId }) => {
  const tasks = await deduplicateWork(uri, isbn, reqUserId)
  return {
    tasks: _.flatten(tasks)
  }
}

module.exports = { sanitization, controller }
