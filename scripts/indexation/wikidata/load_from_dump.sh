#!/usr/bin/env sh

# Dependencies:
# - CouchDB entities database should exist and be populated to be able to fetch works' editions
# - LevelDB popularities should have been transfered

# Index Wikidata entities from dump
# This implementation reflects the current state of the getEntityType function (server/controllers/entities/lib/get_entity_type.js)
# which only lets in entities that have a P31 or P279 value identified in server/lib/wikidata/aliases

node --print "JSON.stringify(require('./server/lib/wikidata/aliases'))" |
  # Get uris used as P31 from indexed types
  jq '.typesAliases | [ .humans, .series, .works, .genres, .publishers, .collections, .movements  ] | flatten[]' -cr |
  # Get the id, wrapped between double quotes
  sed -E 's/wd:(Q.*)/"\1"/' > indexed_types_ids

curl --silent https://dumps.wikimedia.org/wikidatawiki/entities/latest-all.json.gz |
  gzip --decompress |
  # Prefilter to keep only entities that refer to a valid P31 value in some way
  grep --file indexed_types_ids |
  # Drop end-of-line comma to produce valid ndjson
  sed 's/,$//' |
  ./scripts/indexation/load.js wikidata

rm indexed_types_ids

# ## Tip ##
# If importing the dump fails at some point, rather than re-starting from 0,
# you can add a grep step before the grep step above to restart from the latest known line.
# Example:
#    grep '"Q27999075"' --after-context 1000000000000
