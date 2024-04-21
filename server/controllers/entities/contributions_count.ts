// An endpoint to get statistics on users data contributions
// Reserved to admins for the moment, as some data might be considered privacy issue
import { getContributionsFromLastDay, getGlobalContributions } from '#controllers/entities/lib/patches/patches'

const sanitization = {
  period: {
    generic: 'positiveInteger',
    optional: true,
  },
}

async function controller ({ period }) {
  if (period != null) {
    return getContributionsFromLastDay(period)
  } else {
    const contributions = await getGlobalContributions()
    return { contributions }
  }
}

export default { sanitization, controller }
