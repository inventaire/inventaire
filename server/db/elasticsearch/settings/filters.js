const minNgram = 2
const maxGram = 10

module.exports = {
  // Emits edge N-grams of each word
  // See: https://www.elastic.co/guide/en/elasticsearch/reference/7.10/analysis-edgengram-tokenizer.html
  edge_ngram: {
    type: 'edge_ngram',
    min_gram: minNgram,
    max_gram: maxGram,
  },
  // Applies the edge_ngram filter to terms above minNgram. Terms below the minNgram
  // will generate a single unmodified token
  // See https://www.elastic.co/guide/en/elasticsearch/reference/7.17/analysis-condition-tokenfilter.html
  autocomplete_filter: {
    type: 'condition',
    filter: [ 'edge_ngram' ],
    script: {
      source: `token.getTerm().length() > ${minNgram}`
    }
  },
  // An analyzer to apply at search time to match the autocomplete analyzer used at index time
  // See: https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-truncate-tokenfilter.html
  truncate_to_max_gram: {
    type: 'truncate',
    length: maxGram
  }
}
