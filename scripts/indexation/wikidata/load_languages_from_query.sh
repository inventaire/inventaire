#!/usr/bin/env bash

set -euo pipefail

wd sparql ./scripts/indexation/wikidata/all_languages.rq |
  wd data --props info,labels,descriptions,aliases,claims |
  ndjson-apply ./scripts/indexation/wikidata/format_dump_entity.js language |
  ./scripts/indexation/load.js languages
