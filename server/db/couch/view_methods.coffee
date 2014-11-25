_ = require('config').root.require 'builders', 'utils'

module.exports = (dbName)->

  methods =
    viewCustom: (viewName, params)->
      @view(dbName, viewName, params)
      .then _.mapCouchDoc.bind(_)

    viewByKey: (viewName, key)->
      params =
        key: key
        include_docs: true
      @viewCustom viewName, params

  return methods