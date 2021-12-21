// An endpoint to list entities edits made by a user
const { byUserId, byDate, byUserIdAndFilter } = require('./lib/patches')
const error_ = require('lib/error/error')
const { isPropertyUri, isLang } = require('lib/boolean_validations')

const sanitization = {
  user: { optional: true },
  limit: { default: 100, max: 1000 },
  offset: { default: 0 },
  filter: {
    generic: 'string',
    optional: true,
  }
}

const controller = params => {
  const { userId, limit, offset, filter } = params

  const hasFilter = filter != null

  if (hasFilter && !(isPropertyUri(filter) || isLang(filter))) {
    throw error_.new('invalid filter', 400, params)
  }

  if (userId != null) {
    if (hasFilter) {
      return byUserIdAndFilter({ userId, filter, limit, offset })
    } else {
      return byUserId({ userId, limit, offset })
    }
  } else {
    return byDate({ limit, offset })
  }
}

module.exports = { sanitization, controller }
