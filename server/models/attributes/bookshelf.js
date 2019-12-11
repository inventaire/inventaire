const __ = require('config').universalPath
const _ = __.require('builders', 'utils')

module.exports = {
  description: _.isString,
  listing: {
    possibilities: [ 'private', 'network', 'public' ],
    defaultValue: 'private'
  },
  name: _.isString
}
