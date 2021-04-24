# Import entities dump

Create or update entities documents by importing entities from [inventaire.io dumps](https://dumps.inventaire.io).

## Dependencies
* nodejs
* `couchdb-bulk2` (install with `npm install -g couchdb-bulk2`)

## Prerequisites

* A couchdb instance up and running
* An existing couchdb entities database (automatically created when starting inventaire server)

## Import

```sh
wget https://dumps.inventaire.io/inv/latest/entities_with_seeds.ndjson.gz
gzip -d entities_with_seeds.ndjson.gz
cat entities_with_seeds.ndjson |
# Keep only document lines
grep '_id' |
# Drop design docs (managed by the server)
grep -v '"_id":"_design/' |
# Drop _rev ids if restoring on a new database
sed -E 's/,"_rev":"[0-9]+-[0-9a-f]{32}"//'  |
couchdb-bulk2 "http://${couchdb_username}:${couchdb_password}@localhost:5984/entities" > "entities_upload.success" 2> "entities_upload.errors"
```

## Troubleshooting

If the post bulk crash, ie. with an error which looks like `{"error":"unknown_error","reason":"badarg"[...]}`. Restart couch container and add options `--batch-length 50` and/or `--sleep 500` to `couchdb-bulk` command in order to slow down the process allowing couchdb to breath a bit (see https://github.com/apache/couchdb/issues/1184)
