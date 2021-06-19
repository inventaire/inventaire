// An endpoint to list entities edits made by a user
const patches_ = require('./lib/patches')

const sanitization = {
  user: { optional: true },
  limit: { default: 100, max: 1000 },
  offset: { default: 0 }
}

const controller = ({ userId, limit, offset }) => {
  if (userId != null) {
    return patches_.byUserId(userId, limit, offset)
  } else {
    return patches_.byDate(limit, offset)
  }
}

module.exports = { sanitization, controller }
