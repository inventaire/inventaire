#!/usr/bin/env sh

sparql_folder='./scripts/indexation/entities/queries/sparql'
results_folder='./scripts/indexation/entities/queries/results'

for file_type in "$@"; do
  wd sparql "${sparql_folder}/${file_type}.rq" > "${results_folder}/${file_type}"
done
