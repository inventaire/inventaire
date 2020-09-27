// See https://www.elastic.co/guide/en/elasticsearch/reference/2.4/mapping-types.html

module.exports = {
  text: { type: 'text' },
  integer: { type: 'integer' },
  nested: { type: 'nested' },
  keyword: { type: 'keyword' },
  date: { type: 'date' },
  flattened: { type: 'flattened' }
}
