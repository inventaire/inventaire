// See: https://www.elastic.co/guide/en/elasticsearch/reference/7.10/search-analyzer.html

// To update the settings of an existing index:
// - Close index
//   curl -XPOST ${elastic_host}/${index_name}/_close
// - Update index settings:
//   settings_json=$(node -p 'JSON.stringify(require("./server/db/elasticsearch/settings/settings.js"))')
//   curl -XPUT ${elastic_host}/${index_name}/_settings -d "$settings_json" -H "Content-Type: application/json"
// - Reopen index
//   curl -XPOST ${elastic_host}/${index_name}/_open

module.exports = {
  // use number_of_shards in testing environment only
  // See: https://www.elastic.co/guide/en/elasticsearch/guide/current/relevance-is-broken.html
  // number_of_shards: 1,
  analysis: {
    filter: require('./filters'),
    analyzer: require('./analyzers'),
  }
}
