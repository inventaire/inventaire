#!/usr/bin/env sh

results_folder='./scripts/indexation/entities/queries/results'

for file_type in "$@" ; do
  cat "${results_folder}/${file_type}" | wd data | ./scripts/indexation/load.js wikidata
done
