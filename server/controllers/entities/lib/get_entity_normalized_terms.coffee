_ = require 'lodash'

module.exports = (entity)->
  labels = _.values entity.labels
  aliases = _.flatten _.values(entity.aliases)
  terms = labels.concat(aliases).map _.toLower
  return _.uniq terms
