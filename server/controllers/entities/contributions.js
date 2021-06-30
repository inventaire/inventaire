// An endpoint to list entities edits made by a user
const patches_ = require('./lib/patches')

const sanitization = {
  user: { optional: true },
  limit: { default: 100, max: 1000 },
  offset: { default: 0 },
  users: {
    generic: 'boolean',
    optional: true
  },
  period: {
    generic: 'positiveInteger',
    optional: true
  }
}

const controller = async ({ userId, limit, offset, period, users }) => {
  if (users) {
    if (period != null) {
      return patches_.getContributionsFromLastDay(period)
    } else {
      const contributions = await patches_.getGlobalContributions()
      return { contributions }
    }
  }
  if (userId != null) {
    return patches_.byUserId(userId, limit, offset)
  } else {
    return patches_.byDate(limit, offset)
  }
}

module.exports = { sanitization, controller }
