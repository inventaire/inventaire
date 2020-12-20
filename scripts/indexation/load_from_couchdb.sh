#!/usr/bin/env bash

# This script creates a stream of documents that accepts backpressure:
# if the consumer process is slow, CouchDB will wait to send more

set -e

which jq > /dev/null || {
  echo "requires to have jq (https://stedolan.github.io/jq/) installed"
  exit 1
}

if [ "$1" == "" ] ; then
  echo "expected a database base name as first argument"
  exit 1
fi

database_base_name=$1
database_name=$(node -p "require('config').db.name('$1')")

couchdb_database_url=$(node -p "require('config').db.databaseUrl('$1')")
couchdb_auth_host=$(node -p "require('config').db.fullHost()")

elastic_host=$(node -p "require('config').elasticsearch.host")
elastic_index_url="${elastic_host}/${database_name}"

leveldb_folder_path_base=$(node -p "require('config').universalPath.path('leveldb')")
leveldb_folder_path=$(node -p "require('config').db.name('$leveldb_folder_path_base')")

docs_indexed(){
  curl -s "${elastic_index_url}/_stats" | jq ".indices[\"${database_name}\"].total.docs.count // 0"
}

echo -e "\e[0;30m
NODE_ENV: ${NODE_ENV:-default}
database_base_name: ${database_base_name}
database_name: ${database_name}\e[0m

couchdb_database_url: \e[0;32m${couchdb_database_url}\e[0m
elastic_index_url: \e[0;32m${elastic_index_url}\e[0m
leveldb_folder_path: \e[0;32m${leveldb_folder_path}\e[0m

currently indexed documents: $(docs_indexed)
"

echo -n "Continue? y/N "
read response_a
if [ "$response_a" != 'y' ] ; then
  echo 'Stopped by user'
  exit 1
fi

echo -ne "\nReset Elasticsearch index ${elastic_index_url}? y/N "
read response_b
if [ "$response_b" == 'y' ] ; then
  curl -XDELETE "$elastic_index_url"
  echo -e "\n$elastic_index_url was deleted and will be re-created by the indexation/load.js script"
fi

docs_indexed_before=$(docs_indexed)

echo "docs indexed before starting: $docs_indexed_before"

curl -s "${couchdb_auth_host}/${database_name}/_all_docs?include_docs=true" |
  # Omit lines that aren't rows (the first and the last lines)
  grep '{"id"' |
  # Drop end of line comma so that each line is a valid JSON object
  sed 's/,\s*$//' |
  # Parse CouchDB row line to keep only the doc
  jq '.doc' -cr |
  # Pass to loading script, which expects non-suffixed database name
  ./scripts/indexation/load.js "$database_base_name"

echo "Letting Elasticsearch a few seconds to breath, before checking indexation counts"
sleep 2
docs_indexed_after=$(docs_indexed)

if (($docs_indexed_before - $docs_indexed_after >= 0)); then
  echo -e "\e[0;31m
Elasticsearch stats say that it didn't indexed new documents since this script started.

docs_indexed_before: $docs_indexed_before
docs_indexed_after: $docs_indexed_after

This undesired behavior can be worked around by restarting this script and choose to reset Elasticsearch index
\e[0m"
  exit 1
else
  echo -e "\e[0;32m
docs_indexed_before: $docs_indexed_before
docs_indexed_after: $docs_indexed_after

Things seems to have went fine
\e[0m"
fi
