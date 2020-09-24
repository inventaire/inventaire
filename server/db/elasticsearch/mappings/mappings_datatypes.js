// See https://www.elastic.co/guide/en/elasticsearch/reference/2.4/mapping-types.html

module.exports = {
  keyword: { type: 'keyword' },
  date: { type: 'date' },
  flattened: { type: 'flattened' }
}
