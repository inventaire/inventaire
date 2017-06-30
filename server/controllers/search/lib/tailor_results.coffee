CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
getBestLangValue = __.require('sharedLibs', 'get_best_lang_value')(_)

module.exports = (lang)-> (results)->
  unless lang then return results

  results
  .map (result)->
    { _type, _source } = result
    return formatters[_type](result, _source, lang)

entityFormatter = (result, _source, lang)->
  id: result._id
  type: result._type
  uri: getUri result._index, result._id
  label: getBestLangValue(lang, null, _source.labels).value
  description: getBestLangValue(lang, null, _source.descriptions).value?[0..200]
  image: getBestLangValue(lang, null, _source.images).value

getUri = (index, id)-> if index is 'wikidata' then "wd:#{id}" else "inv:#{id}"

networkFormatter = (labelAttr, descAttr)->
  return (result, _source, lang)->
    id: result._id
    type: result._type
    label: _source[labelAttr]
    description: _source[descAttr]?[0..200]
    image: _source.picture

formatters =
  works: entityFormatter
  humans: entityFormatter
  series: entityFormatter
  users: networkFormatter 'username', 'bio'
  groups: networkFormatter 'name', 'description'
