#!/usr/bin/env bash

# Usage:
#   npm run couchdb:restore-databases http://username:password@localhost:5984 prod
#
# See docs/couchdb_backup_and_restore.md

set -euo pipefail

couchdb_url=$1
suffix=${2:-""}
backup_directory_base=$(node -p "require('config').db.backupDirectory")
echo "backups directory: $backup_directory_base"

backup_directory_name=$(ls -1 --reverse --color=never "$backup_directory_base" | fzf --no-info --header "Select a backup directory" --reverse --preview "du -ah $backup_directory_base/{1}" --exit-0)
backup_directory="$backup_directory_base/$backup_directory_name"

echo "picked backup directory: $backup_directory"

ops_logs_directory=$(mktemp --directory /tmp/databases_restoration.XXXXX)

echo "operations logs directory: $ops_logs_directory"

drop_revs(){
  sed --regexp-extended 's/,"_rev":"[0-9]+-[0-9a-f]{32}"//'
}

for name in $(./scripts/couchdb/get_databases_names.ts "$suffix") ; do
  file_path="$backup_directory/$name.ndjson.gz"
  echo -e "\nrestoring $name from $file_path"
  db_url="$couchdb_url/$name"
  db_doc_counts=$(curl --silent "$db_url" | jq .doc_count || exit 1)
  if [[ "$db_doc_counts" != "null" ]]; then
    echo "$name db exists (doc counts: $db_doc_counts): passing"
  else
    echo "$name db does not exist: creating and restoring"
    curl -XPUT "$db_url"
    gzip --decompress < "$file_path" | drop_revs | couchdb-bulk2 "$db_url" > "$ops_logs_directory/$name.success" 2> "$ops_logs_directory/$name.errors"
  fi
done
