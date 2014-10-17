lodash = require('lodash')
serverUtils = require '../lib/utils'

utils = lodash.assign(lodash, serverUtils)

sharedUtils = sharedLib('utils')(utils)

module.exports = lodash.assign(utils, sharedUtils)
