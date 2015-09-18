module.exports =
  stringObject: (val)->
    type: 'string'
    value: val

  wikidataObject: (wikidataId, label)->
    type: 'wikidata_id'
    value: wikidataId
    label: label
