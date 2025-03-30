#!/usr/bin/env bash

set -euo pipefail

# ex: "http://username:password@localhost:7984/comments"
db_authentified_database_url="$1"

curl --fail "$db_authentified_database_url/_all_docs?include_docs=true" |
  # Omit first and last lines
  grep 'id' |
  # Ignore design docs
  grep --invert-match 'id":"_design/' |
  # Drop end of line comma
  sed --regexp-extended 's/,\s*$//' |
  # Parse doc from include_docs=true view row
  jq 'if (.doc) then .doc else . end' --compact-output --raw-output --monochrome-output
