_ = require('config').root.require 'builders', 'utils'

module.exports = (dbName)->

  methods =
    viewCustom: (viewName, query)->
      _.types arguments, 'string', 'object'
      @view(dbName, viewName, query)
      .then _.mapCouchDoc.bind(_)

    viewByKeysCustom: (viewName, keys, query)->
      _.types arguments, 'string', 'array', 'object'
      @viewKeys(dbName, viewName, keys, query)
      .then _.mapCouchDoc.bind(_)

    viewByKey: (viewName, key)->
      _.types arguments, 'string', 'string'
      query =
        key: key
        include_docs: true
      @viewCustom viewName, query

    viewByKeys: (viewName, keys)->
      _.types arguments, 'string', 'array'
      query = { include_docs: true }
      @viewByKeysCustom viewName, keys, query

  return methods