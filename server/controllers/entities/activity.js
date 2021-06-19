// An endpoint to get statistics on users data contributions
// Reserved to admins for the moment, as some data might be considered privacy issue
const patches_ = require('./lib/patches')

const sanitization = {
  period: {
    generics: 'positiveInteger',
    optional: true
  }
}

const controller = async ({ period }) => {
  if (period != null) {
    return patches_.getActivityFromLastDay(period)
  } else {
    const activity = await patches_.getGlobalActivity()
    return { activity }
  }
}

module.exports = { sanitization, controller }
