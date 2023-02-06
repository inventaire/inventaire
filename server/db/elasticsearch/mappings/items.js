import { autocompleteText, keyword, keywordArray, date } from './mappings_datatypes.js'

export default {
  properties: {
    _rev: keyword,
    owner: keyword,
    entity: keyword,
    visibility: keywordArray,
    transaction: keyword,
    created: date,
    details: autocompleteText,
    shelves: keywordArray,
    snapshot: {
      properties: {
        'entity:title': autocompleteText,
        'entity:subtitle': autocompleteText,
        'entity:authors': autocompleteText,
        'entity:series': autocompleteText,
        'entity:lang': keyword,
        // Stored to be accessible from search results.
        // Indexation can not be disabled here as it's not possible with type=keyword
        // See https://www.elastic.co/guide/en/elasticsearch/reference/current/enabled.html
        'entity:image': keyword,
      },
    },
  },
}
