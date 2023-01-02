import deduplicateWork from './lib/deduplicate_works.js'

const sanitization = {
  uri: {},
  isbn: {},
}

const controller = async ({ uri, isbn, reqUserId }) => {
  const tasks = await deduplicateWork(uri, isbn, reqUserId)
  return {
    tasks: (tasks || []).flat(),
  }
}

export default { sanitization, controller }
