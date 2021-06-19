const { getEntitiesPopularities } = require('./lib/popularity')

const sanitization = {
  uris: {},
  refresh: { optional: true }
}

const controller = async params => {
  const scores = await getEntitiesPopularities(params)
  return { scores }
}

module.exports = { sanitization, controller }
