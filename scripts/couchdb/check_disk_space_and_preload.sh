#!/usr/bin/env bash

df --human-readable

echo -n "Is there enough disk space to regenerate view files from the design docs that changed? y/N "
read response_a
if [ "$response_a" != 'y' ] ; then
  echo 'Stopped by user'
  exit 1
fi

./scripts/couchdb/preload_design_docs_changes.ts

