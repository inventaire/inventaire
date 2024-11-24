#!/usr/bin/env bash

df --human-readable

echo "Is there enough disk space to regenerate view files from the design docs that changed?"
echo "Where databases and views compressed recently enough? See https://docs.couchdb.org/en/stable/maintenance/compaction.html#manual-view-compaction"
echo -n "y/N "
read response_a
if [ "$response_a" != 'y' ] ; then
  echo 'Stopped by user'
  exit 1
fi

./scripts/couchdb/preload_design_docs_changes.ts

