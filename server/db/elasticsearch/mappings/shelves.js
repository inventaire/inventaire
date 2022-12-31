import { text, keyword, keywordArray, date } from './mappings_datatypes'

export default {
  properties: {
    name: text,
    description: text,
    owner: keyword,
    visibility: keywordArray,
    created: date,
  }
}
