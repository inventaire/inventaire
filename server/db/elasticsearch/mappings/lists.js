const { text, keyword, keywordArray, date } = require('./mappings_datatypes')

module.exports = {
  properties: {
    name: text,
    description: text,
    creator: keyword,
    visibility: keywordArray,
    created: date,
  }
}
