// An endpoint to get statistics on users data contributions
// Reserved to admins for the moment, as some data might be considered privacy issue
import patches_ from './lib/patches/patches'

const sanitization = {
  period: {
    generic: 'positiveInteger',
    optional: true
  }
}

const controller = async ({ period }) => {
  if (period != null) {
    return patches_.getContributionsFromLastDay(period)
  } else {
    const contributions = await patches_.getGlobalContributions()
    return { contributions }
  }
}

export default { sanitization, controller }
