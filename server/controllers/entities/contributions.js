// An endpoint to list entities edits made by a user
const { byUserId, byDate, byUserIdAndFilter } = require('./lib/patches')
const error_ = require('lib/error/error')

const sanitization = {
  user: { optional: true },
  limit: { default: 100, max: 1000 },
  offset: { default: 0 },
  property: { optional: true },
  lang: {
    optional: true,
    // Override global parameter default
    default: null,
  },
}

const controller = params => {
  const { userId, limit, offset, property, lang } = params
  if (property && lang) {
    throw error_.new('can not use both property and lang filters', 400, params)
  }

  const filter = property || lang

  if (userId != null) {
    if (filter) {
      return byUserIdAndFilter({ userId, filter, limit, offset })
    } else {
      return byUserId({ userId, limit, offset })
    }
  } else {
    return byDate({ limit, offset })
  }
}

module.exports = { sanitization, controller }
