const _ = require('builders/utils')
const checkEntity = require('./lib/check_entity')

const sanitization = {
  uris: {}
}

const controller = async ({ uris }) => {
  const tasks = await Promise.all(uris.map(checkEntity))
  return { tasks: _.flatten(tasks) }
}

module.exports = { sanitization, controller }
