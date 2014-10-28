__ = require('config').root

lodash = require 'lodash'
serverUtils = __.require 'lib', 'utils'

utils = lodash.assign(lodash, serverUtils)

sharedUtils = __.require('sharedLibs', 'utils')(utils)

module.exports = lodash.assign(utils, sharedUtils)
