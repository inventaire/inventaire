#!/usr/bin/env bash

set -eu

# keep A (added) and M (modified) files
# only if staged (0 space before/2 space after the letter)
staged=$(git status --porcelain | grep --extended-regexp "^(A|M)" | grep --extended-regexp '.js$' | sed --regexp-extended 's/^\w+\s+//')

if [ -z "$staged" ]
  then
    echo 'no file to lint'
  else
    npm run lint -- "$@" $staged
fi
