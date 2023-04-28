# CouchDB backup and restore

## Backup Couch
Assuming that CouchDB is running on localhost:5984, and that we want to backup `prod`-suffixed databases
```sh
npm run couchdb:backup-databases http://username:password@localhost:5984 prod
```

## Restore

Dependencies:
* `jq` (see https://stedolan.github.io/jq/)
* `couchdb-bulk2` (install with `npm install -g couchdb-bulk2`)

```sh
# Enter the backup folder
cd ./2023-04-28
# Decompress databases exports
gzip --decompress *gz

# If restoring on empty databases, you need to drop documents revs
sed --in-place --regexp-extended 's/,"_rev":"[0-9]+-[0-9a-f]{32}"//' *ndjson

db_host="http://${db_username}:${db_password}@localhost:5984"

for db_restore_file in *.ndjson ; do
  db_name=$(echo "$db_restore_file" | sed 's/\.ndjson//')
  echo "db_name: $db_name"
  cat $db_restore_file | couchdb-bulk2 "$db_host/$db_name" > "${db_name}_restore.success" 2> "${db_name}_restore.errors"
done
```
