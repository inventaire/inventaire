// See https://www.elastic.co/guide/en/elasticsearch/reference/2.4/mapping-types.html

module.exports = {
  string: { type: 'string' },
  keyword: { type: 'keyword' },
  date: { type: 'date' },
  flattened: { type: 'flattened' }
}
