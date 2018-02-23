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
{ offline } = CONFIG
{ updateEnabled, host, delay } = CONFIG.entitiesSearchEngine
radio = __.require 'lib', 'radio'

module.exports = ->
  if not updateEnabled or offline then return

  _.info 'initializing entitiesSearchEngine update'

  urisPerType = {}

  requestUpdate = ->
    [ body, urisPerType ] = [ urisPerType, {} ]
    promises_.post { url: host, body }
    .then -> _.log body, 'requested entities search engine updates'
    .catch (err)->
      if err.message.match 'ECONNREFUSED'
        _.warn 'entities search engine updater is offline'
      else
        _.error err, 'entities search engine update err'

  # Send a batch every #{delay} milliseconds max
  lazyRequestUpdate = _.throttle requestUpdate, delay, { leading: false }

  add = (uri, type='other')->
    # Also include entities without known type
    # so that a Wikidata entity that got a wdt:P31 update
    # that doesn't match any known type still triggers an update
    # to unindex the formerly known type
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
