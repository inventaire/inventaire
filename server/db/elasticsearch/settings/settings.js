// See: https://www.elastic.co/guide/en/elasticsearch/reference/current/search-analyzer.html

module.exports = {
  // use number_of_shards in testing environment only
  // See: https://www.elastic.co/guide/en/elasticsearch/guide/current/relevance-is-broken.html
  // number_of_shards: 1,
  analysis: {
    filter: {
      // emits N-grams of each word
      // See: https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-edgengram-tokenizer.html
      autocomplete_filter: {
        type: 'edge_ngram',
        min_gram: 2,
        max_gram: 10
      }
    },
    analyzer: {
      autocomplete: {
        type: 'custom',
        // define standard stop words
        // See https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-standard-tokenizer.html
        tokenizer: 'standard',
        filter: [
          'lowercase',
          'autocomplete_filter'
        ]
      }
    }
  }
}
