# Keep our entitiesSearchEngine instance updated by requesting it
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
{ updateEnabled, host, delay } = CONFIG.entitiesSearchEngine
radio = __.require 'lib', 'radio'

module.exports = ->
  unless updateEnabled then return

  _.info 'initializing entitiesSearchEngine update'

  urisPerType = {}
  requestUpdate = ->
    [ body, urisPerType ] = [ urisPerType, {} ]
    _.log body, 'requested entities search engine updates'
    promises_.post { url: host, body }
    .catch _.Error('entities search engine update err')

  # Send a batch every 30 seconds max
  lazyRequestUpdate = _.throttle requestUpdate, delay, { leading: false }

  add = (uri, type)->
    if type?
      pluralizedType = type + 's'
      urisPerType[pluralizedType] or= []

      # Deduplicating
      unless uri in urisPerType[pluralizedType]
        urisPerType[pluralizedType].push uri

      lazyRequestUpdate()

  radio.on 'inv:entity:update', (invId, type)-> add "inv:#{invId}", type
  # Ideally, we should update Wikidata entities on every changes
  # but that would require to follow a change feed of Wikidata entities,
  # which isn't that straight forward, so refreshing on every cache miss instead,
  # that is, for every new entity + when cache expired + when a data refresh is requested
  radio.on 'wikidata:entity:cache:miss', (wdId, type)-> add "wd:#{wdId}", type
