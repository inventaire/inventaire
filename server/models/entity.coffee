# DATA MODEL
# _id: CouchDB uuid
# claims: an object with properties and their associated statements
# labels: an object with labels in different languages

# labels?
# descriptions?
# aliases?
# sitelinks? qid?

# use Wikidata data model as reference:
# https://www.mediawiki.org/wiki/Wikibase/DataModel/JSON

# Used prefixes:
# Entities:
#   PREFIX wd: <http://www.wikidata.org/entity/>
#   PREFIX inv: <https://inventaire.io/entity/>
# Properties:
#   PREFIX wdt: <http://www.wikidata.org/prop/direct/>
#   PREFIX invp: <https://inventaire.io/property/>

# Inventaire properties:
# invp:P1: Wikidata Id

CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
tests = require './tests/common-tests'
promises_ = __.require 'lib', 'promises'

{ properties, whitelist } = __.require 'controllers','entities/lib/properties'
inferences = __.require 'controllers','entities/lib/inferences'

module.exports = Entity =
  create: ->
    type: 'entity'
    labels: {}
    claims: {}

  setLabel: (doc, lang, value)->
    _.types arguments, [ 'object', 'string', 'string' ]
    unless _.isLang lang then throw error_.new 'invalid lang', 400, arguments
    preventRedirectionEdit doc, 'setLabel'
    doc.labels[lang] = value
    return doc

  setLabels: (doc, labels)->
    preventRedirectionEdit doc, 'setLabels'
    for lang, value of labels
      doc = Entity.setLabel doc, lang, value

    return doc

  addClaims: (doc, claims)->
    preventRedirectionEdit doc, 'addClaims'

    # Pass the list of all edited properties, so that wen trying to infer property
    # values, we know which one should not be infered at the risk of creating
    # a conflict
    doc._allClaimsProps = Object.keys claims

    for property, array of claims
      prop = properties[property]
      # claims will be validated one by one later but some collective checks are needed

      if prop.uniqueValue
        if array.length > 1
          message = "#{property} expects a unique value, got #{array}"
          throw error_.new message, 400, arguments


      for value in array
        doc = Entity.createClaim doc, property, value

    delete doc._allClaimsProps
    return doc

  createClaim: (doc, property, value)->
    preventRedirectionEdit doc, 'createClaim'
    return Entity.updateClaim doc, property, null, value

  updateClaim: (doc, property, oldVal, newVal)->
    preventRedirectionEdit doc, 'updateClaim'
    unless oldVal? or newVal?
      throw error_.new 'missing old or new value', 400, arguments

    propArray = _.get doc, "claims.#{property}"
    _.info "#{property} propArray: #{propArray} /oldVal: #{oldVal} /newVal: #{newVal}"

    if propArray? and newVal? and newVal in propArray
      throw error_.new 'claim property new value already exist', 400, [ propArray, newVal ]

    if oldVal?
      if not propArray? or oldVal not in propArray
        throw error_.new 'claim property value not found', 400, arguments

      if newVal?
        index = propArray.indexOf oldVal
        doc.claims[property][index] = newVal
      else
        # if the new value is null, it plays the role of a removeClaim
        propArray = _.without propArray, oldVal
        setPossiblyEmptyPropertyArray doc, property, propArray

    else
      # if the old value is null, it plays the role of a createClaim
      doc.claims[property] or= []
      doc.claims[property].push newVal

    return updateInferredProperties doc, property, oldVal, newVal

  # 'from' and 'to' refer to the redirection process which rely on merging two existing document:
  # redirecting from an entity to another entity, only the 'to' doc will survive
  mergeDocs: (fromEntityDoc, toEntityDoc)->
    preventRedirectionEdit fromEntityDoc, 'mergeDocs (from)'
    preventRedirectionEdit toEntityDoc, 'mergeDocs (to)'
    # Giving priority to the toEntityDoc labels and claims
    toEntityDoc.labels = _.extend {}, fromEntityDoc.labels, toEntityDoc.labels
    toEntityDoc.claims = _.extend {}, fromEntityDoc.claims, toEntityDoc.claims
    return toEntityDoc

  turnIntoRedirection: (fromEntityDoc, toUri, removedPlaceholdersIds)->
    [ prefix, id ] = toUri.split ':'

    if prefix is 'inv' and id is fromEntityDoc._id
      throw error_.new 'circular redirection', 500, arguments

    return {
      _id: fromEntityDoc._id
      _rev: fromEntityDoc._rev
      type: 'entity'
      redirect: toUri
      # the list of placeholders entities to recover if the merge as to be reverted
      removedPlaceholdersIds: removedPlaceholdersIds
    }

  removePlaceholder: (entityDoc)->
    if entityDoc.redirect?
      throw error_.new "can't turn a redirection into a removed placeholder", 400, entityDoc

    removedDoc = _.cloneDeep entityDoc
    removedDoc.type = 'removed:placeholder'
    return removedDoc

  recoverPlaceholder: (entityDoc)->
    recoveredDoc = _.cloneDeep entityDoc
    recoveredDoc.type = 'entity'
    return recoveredDoc

updateInferredProperties = (doc, property, oldVal, newVal)->
  declaredProperties = doc._allClaimsProps or []
  # Use _allClaimsProps to list properties that shouldn't be inferred
  propInferences = _.omit inferences[property], declaredProperties

  addingOrUpdatingValue = newVal?

  for inferredProperty, convertor of propInferences
    inferredPropertyArray = doc.claims[inferredProperty] or []

    if addingOrUpdatingValue
      inferredValue = convertor newVal
      # Known case of missing infered value:
      # ISBN-13 with a 979 prefix will not have an ISBN-10
      if inferredValue?
        if inferredValue not in inferredPropertyArray
          inferredPropertyArray.push inferredValue
          _.log inferredValue, "added inferred #{inferredProperty} from #{property}"
      else
        _.warn newVal, "inferred value not found for #{inferredProperty} from #{property}"

    else
      # The current entity data model doesn't allow to check if the claim was
      # indeed inferred or if it was manually added.
      # This could be made possible by replacing claims direct values by an object:
      # {
      #   id: 'claim uuid prefixed by property uri (following wikidata data model)',
      #   value: "claim value",
      #   inferredFrom: 'claim id'
      # }
      inferredValue = convertor oldVal
      if inferredValue in inferredPropertyArray
        inferredPropertyArray = _.without inferredPropertyArray, inferredValue
        _.log inferredValue, "removed inferred #{inferredProperty} from #{property}"

    setPossiblyEmptyPropertyArray doc, inferredProperty, inferredPropertyArray

  return doc

setPossiblyEmptyPropertyArray = (doc, property, propertyArray)->
  if propertyArray.length is 0
    # if empty, clean the doc from the property
    doc.claims = _.omit doc.claims, property
  else
    doc.claims[property] = propertyArray

preventRedirectionEdit = (doc, editLabel)->
  if doc.redirect?
    throw error_.new "#{editLabel} failed: the entity is a redirection", 400, arguments
