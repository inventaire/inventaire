// An endpoint to get entities history as snapshots and diffs
const patches_ = require('./lib/patches')

const sanitization = {
  id: {}
}

const controller = async ({ id }) => {
  const patches = await patches_.getWithSnapshots(id)
  return { patches }
}

module.exports = { sanitization, controller }
