// See: https://www.elastic.co/guide/en/elasticsearch/reference/7.10/search-analyzer.html

// To update the settings of an existing index:
// - Close index
//   curl -XPOST ${elastic_host}/${index_name}/_close
// - Update index settings:
//   settings_json=$(node -p 'JSON.stringify(require("./server/db/elasticsearch/settings/settings.js"))')
//   curl -XPUT ${elastic_host}/${index_name}/_settings -d "$settings_json"
// - Reopen index
//   curl -XPOST ${elastic_host}/${index_name}/_open

const maxGram = 10

module.exports = {
  // use number_of_shards in testing environment only
  // See: https://www.elastic.co/guide/en/elasticsearch/guide/current/relevance-is-broken.html
  // number_of_shards: 1,
  analysis: {
    filter: {
      // emits N-grams of each word
      // See: https://www.elastic.co/guide/en/elasticsearch/reference/7.10/analysis-edgengram-tokenizer.html
      autocomplete_filter: {
        type: 'edge_ngram',
        min_gram: 1,
        max_gram: maxGram
      },
      // An analyzer to apply at search time to match the autocomplete analyzer used at index time
      // See: https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-truncate-tokenfilter.html
      truncate_to_max_gram: {
        type: 'truncate',
        length: maxGram
      }
    },
    analyzer: {
      autocomplete: {
        type: 'custom',
        // define standard stop words
        // See https://www.elastic.co/guide/en/elasticsearch/reference/7.10/analysis-standard-tokenizer.html
        tokenizer: 'standard',
        filter: [
          // The 'standard' tokenizer does not imply lowercase
          // https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis-standard-tokenizer.html
          // not to be confused with the 'standard' analyzer, which does
          // https://www.elastic.co/guide/en/elasticsearch/reference/7.10/analysis-standard-analyzer.html
          'lowercase',
          'autocomplete_filter'
        ]
      },
      standard_truncated: {
        type: 'custom',
        // define standard stop words
        // See https://www.elastic.co/guide/en/elasticsearch/reference/7.10/analysis-standard-tokenizer.html
        tokenizer: 'standard',
        filter: [
          'lowercase',
          'truncate_to_max_gram'
        ]
      },
    }
  }
}
