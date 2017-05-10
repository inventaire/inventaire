CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ work, edition, human, serie } = __.require('sharedLibs', 'properties_per_type')(_)

serverOnlyProperties = [
  # Currently not handled from client-side
  'wdt:P31'
]

module.exports =
  work: serverOnlyProperties.concat Object.keys(work)
  edition: serverOnlyProperties.concat Object.keys(edition)
  human: serverOnlyProperties.concat Object.keys(human)
  serie: serverOnlyProperties.concat Object.keys(serie)
