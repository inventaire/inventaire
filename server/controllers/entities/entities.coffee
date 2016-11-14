__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
searchEntity = require './search_entity'
getEntities = require './get_entities'
createEntity = require './create_entity'
reverseClaims = require './reverse_claims'
customQuery = require './custom_query'
updateClaim = require './update_claim'
updateLabel = require './update_label'
getChanges = require './get_changes'

module.exports =
  # public
  get: (req, res) ->
    { action } = req.query

    unless action? then return missingActionParameter req, res

    switch action
      when 'search' then return searchEntity req, res
      when 'get-entities' then return getEntities req, res
      when 'get-changes' then return getChanges req, res
      # when 'get-images' then return getImages req, res
      when 'reverse-claims' then return reverseClaims req, res
      when 'author-works', 'serie-parts' then return customQuery req, res
      else error_.unknownAction req, res

  # authentified
  post: createEntity
  put: (req, res)->
    { action } = req.query

    unless action? then return missingActionParameter req, res

    switch action
      when 'update-claim' then return updateClaim req, res
      when 'update-label' then return updateLabel req, res
      else error_.unknownAction req, res

missingActionParameter = (req, res)->
  error_.bundle req, res, 'missing action parameter', 400
