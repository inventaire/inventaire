#!/usr/bin/env sh

curl -s https://dumps.wikimedia.org/wikidatawiki/entities/latest-all.json.gz | \
  # Decompress
  gzip -d | \
  # Keep only entities having the claim P31:Q5
  # Omit the attributes type, claims, sitelinks,
  # keeping only info, labels, aliases and descriptions.
  # TODO: add prefiltering https://github.com/maxlath/wikibase-dump-filter/blob/master/docs/prefilter.md
  wikibase-dump-filter --claim $1 --omit type,sitelinks | \
  ./scripts/entities_search_engine/import_to_elasticsearch.js $2
