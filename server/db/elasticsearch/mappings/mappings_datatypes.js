// See https://www.elastic.co/guide/en/elasticsearch/reference/2.4/mapping-types.html

module.exports = {
  string: { type: 'string' },
  // Will simply be type=keyword in later ES versions
  // See https://www.elastic.co/guide/en/elasticsearch/reference/7.7/keyword.html
  keyword: {
    type: 'string',
    index: 'not_analyzed'
  },
  date: {
    type: 'date'
  }
}
