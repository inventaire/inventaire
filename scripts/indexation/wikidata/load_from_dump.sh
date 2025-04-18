#!/usr/bin/env bash

set -euo pipefail

which jq > /dev/null || {
  echo "requires to have jq (https://stedolan.github.io/jq/) installed"
  exit 1
}

# Dependencies:
# - an access to the Elasticsearch wikidata index to load
# - CouchDB entities database should exist and be populated to be able to fetch works' editions
# - LevelDB popularities should have been transfered

# Index Wikidata entities from dump
# This implementation reflects the current state of the getWdEntityType function (server/controllers/entities/lib/get_entity_type.js)
# which only lets in entities that have a P31 value identified in server/lib/wikidata/aliases

indexed_types_ids=$(mktemp)

./scripts/entities_extended_types_aliases/check_extended_aliases_freshness.ts 1

./scripts/print_module_exports.sh ./server/db/elasticsearch/indexes.ts indexedEntitiesTypesAliases |
  jq '.[]' -cr |
  sed --regexp-extended 's/wd:(Q.*)/"\1"/' > "$indexed_types_ids"

# This pipeline can be done on any machine. For performance reasons,
# it may be done on a machine that is not the production server as it
# does not need access to either the prod CouchDB, LevelDB, or Elasticsearch
curl --silent https://dumps.wikimedia.org/wikidatawiki/entities/latest-all.json.gz |
  gzip --decompress |
  # Prefilter to keep only entities that refer to a valid P31 value in some way
  grep --file "$indexed_types_ids" |
  # Drop end-of-line comma to produce valid ndjson
  sed 's/,$//' |
  ndjson-apply-ts ./scripts/indexation/wikidata/format_dump_entity.ts |
  gzip --best > entities.filtered.simplified.ndjson.gz

# This pipeline should ideally be done on a machine with access to
# - the Elasticsearch wikidata index
# - the entities-prod database (CouchDB)
# - popularity scores (LevelDB)
gzip -d < entities.filtered.simplified.ndjson.gz | ./scripts/indexation/load.ts wikidata

# ## Tip ##
# If importing the dump fails at some point, rather than re-starting from 0,
# you can add a grep step before the grep step above to restart from the latest known line.
# Example:
#    grep '"Q27999075"' --after-context 1000000000000
