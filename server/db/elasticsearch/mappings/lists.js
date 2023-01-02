import { text, keyword, keywordArray, date } from './mappings_datatypes.js'

export default {
  properties: {
    name: text,
    description: text,
    creator: keyword,
    visibility: keywordArray,
    created: date,
  }
}
