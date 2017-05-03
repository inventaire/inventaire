# Keep our wikidataSubsetSearchEngine instance updated by requesting it
# to update its data everytime an entity with a type is requested here:
# Every cache miss triggers an update request, meaning that 'refresh' request
# are also propagated to the search engine \o/
# see https://github.com/inventaire/wikidata-subset-search-engine

# Other advantage of requesting update from here:
# - we already have the logic to determine the entity's type
# - it allows to keep the access to the search engine update endpoint restricted:
#   the endpoint can trust the input entity type to be true without having to
#   check it itself

CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
{ updateEnabled, host } = CONFIG.wikidataSubsetSearchEngine
radio = __.require 'lib', 'radio'

module.exports = ->
  unless updateEnabled then return

  _.info 'initializing wikidataSubsetSearchEngine update'

  idsPerType = {}
  requestUpdate = ->
    [ body, idsPerType ] = [ idsPerType, {} ]
    _.log body, 'requested Wikidata entities Search Engine updates'
    promises_.post { url: host, body }
    .catch _.Error('WSSE update err')

  # Send a batch every 30 seconds max
  lazyRequestUpdate = _.throttle requestUpdate, 30000, { leading: false }

  radio.on 'wikidata:entity:cache:miss', (wdId, type)->
    if type?
      pluralizedType = type + 's'
      idsPerType[pluralizedType] or= []
      idsPerType[pluralizedType].push wdId
      lazyRequestUpdate()
