#!/usr/bin/env sh

curl -s https://dumps.wikimedia.org/wikidatawiki/entities/latest-all.json.bz2 | \
  # Decompress
  pbzip2 -cd | \
  # Prefilter to keep only entities that refer to Q5 in some way
  grep '"Q5"' | \
  # Keep only entities having the claim P31:Q5
  # Omit the attributes type, claims, sitelinks, keeping only info, labels, aliases and descriptions.
  wikibase-dump-filter --claim $1 --omit type,sitelinks | \
  ./scripts/entities_indexation/import_to_elasticsearch.js $2
