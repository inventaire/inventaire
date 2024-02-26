#!/usr/bin/env bash

# Usage:
#   npm run couchdb:restore-databases http://username:password@localhost:5984 prod
#
# See docs/couchdb_backup_and_restore.md

set -euo pipefail

couchdb_url=$1
suffix=${2:-""}
backup_folder_base=$(node -p "require('config').db.backupFolder")
echo "backups folder: $backup_folder_base"

backup_folder_name=$(ls -1 --reverse --color=never "$backup_folder_base" | fzf --no-info --header "Select a backup folder" --reverse --preview "du -ah $backup_folder_base/{1}" --exit-0)
backup_folder="$backup_folder_base/$backup_folder_name"

echo "picked backup folder: $backup_folder"

ops_logs_folder=$(mktemp --directory /tmp/databases_restoration.XXXXX)

echo "operations logs folder: $ops_logs_folder"

drop_revs(){
  sed --regexp-extended 's/,"_rev":"[0-9]+-[0-9a-f]{32}"//'
}

for name in $(./scripts/couchdb/get_databases_names.ts "$suffix") ; do
  file_path="$backup_folder/$name.ndjson.gz"
  echo -e "\nrestoring $name from $file_path"
  db_url="$couchdb_url/$name"
  db_doc_counts=$(curl --silent "$db_url" | jq .doc_count || exit 1)
  if [[ "$db_doc_counts" != "null" ]]; then
    echo "$name db exists (doc counts: $db_doc_counts): passing"
  else
    echo "$name db does not exist: creating and restoring"
    curl -XPUT "$db_url"
    gzip --decompress < "$file_path" | drop_revs | couchdb-bulk2 "$db_url" > "$ops_logs_folder/$name.success" 2> "$ops_logs_folder/$name.errors"
  fi
done
