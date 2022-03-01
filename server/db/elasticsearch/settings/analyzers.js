module.exports = {
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
      'asciifolding',
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
      'asciifolding',
      'truncate_to_max_gram'
    ]
  },
  standard_full: {
    type: 'custom',
    tokenizer: 'standard',
    filter: [
      'lowercase',
      'asciifolding',
    ]
  },
}
