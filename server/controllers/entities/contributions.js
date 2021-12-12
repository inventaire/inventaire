// An endpoint to list entities edits made by a user
const { byUserId, byDate, byUserIdAndProperty } = require('./lib/patches')
const error_ = require('lib/error/error')

const sanitization = {
  user: { optional: true },
  limit: { default: 100, max: 1000 },
  offset: { default: 0 },
  property: { optional: true },
  lang: { optional: true },
}

const controller = params => {
  const { userId, limit, offset, lang } = params
  let { property } = params
  if (property && lang) {
    throw error_.new('can not use both property and lang filters', 400, params)
  }

  property = property || lang

  if (userId != null) {
    if (property) {
      return byUserIdAndProperty({ userId, property, limit, offset })
    } else {
      return byUserId({ userId, limit, offset })
    }
  } else {
    return byDate({ limit, offset })
  }
}

module.exports = { sanitization, controller }
