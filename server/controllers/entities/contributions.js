// An endpoint to list entities edits made by a user
const { byUserId, byDate, byUserIdAndProperty } = require('./lib/patches')

const sanitization = {
  user: { optional: true },
  limit: { default: 100, max: 1000 },
  offset: { default: 0 },
  property: { optional: true },
}

const controller = ({ userId, limit, offset, property }) => {
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
