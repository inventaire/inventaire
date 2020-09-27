// See: https://www.elastic.co/guide/en/elasticsearch/reference/current/search-analyzer.html

module.exports = {
  analysis: {
    tokenizer: {
      autocomplete: {
        type: 'edge_ngram',
        min_gram: 2,
        max_gram: 10
      }
    },
    analyzer: {
      autocomplete: {
        tokenizer: 'autocomplete',
        filter: [ 'lowercase' ]
      }
    }
  }
}
