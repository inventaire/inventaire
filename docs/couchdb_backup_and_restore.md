# CouchDB backup and restore

## Backup Couch
Assuming that we are
```sh
mkdir -p ./backups/couchdb
npm run backup-databases prod
```

## Restore

Dependencies:
* `jq` (see https://stedolan.github.io/jq/)
* `couchdb-bulk2` (install with `npm install -g couchdb-bulk2`)

```sh
# Uncompress the backup folder
tar xzf 2020-12-16.tar.gz
cd 2020-12-16

db_host="http://${db_username}:${db_password}@localhost:5984"

for db_backup_file in *.json ; do
  db_name=$(echo "$db_backup_file" | sed 's/\.json//')
  echo "db_name: $db_name"
  cat $db_backup_file |
  # Keep only document lines
  grep '_id' |
  # Drop design docs (managed by the server)
  grep -v '"_id":"_design/' |
  # Drop commas
  sed 's/,$//' |
  # Drop _rev ids if restoring on a new database
  sed -E 's/,"_rev":"[0-9]+-[0-9a-f]{32}"//'  > "$db_name.ndjson"
done

# Check that the files look like expected and let's get started!

for db_restore_file in *.ndjson ; do
  db_name=$(echo "$db_restore_file" | sed 's/\.ndjson//')
  echo "db_name: $db_name"
  cat $db_restore_file | couchdb-bulk2 "$db_host/$db_name" > "${db_name}_restore.success" 2> "${db_name}_restore.errors"
done
```
