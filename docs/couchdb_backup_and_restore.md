# CouchDB backup and restore

## Backup CouchDB databases
Assuming that CouchDB is running on localhost:5984, and that we want to backup `prod`-suffixed databases
```sh
npm run couchdb:backup-databases http://yourcouchdbusername:yourcouchdbpassword@localhost:5984 prod
```

## Restore CouchDB databases

Dependencies:
* `jq` (see https://stedolan.github.io/jq/)
* `couchdb-bulk2` (install with `npm install -g couchdb-bulk2`)
* `fzf`

Assuming that CouchDB is running on localhost:5984, that we want to backup `prod`-suffixed databases, and there is at least one backup subdirectory in the the backup directory set in config (by default `backups/couchdb`)
```sh
npm run couchdb:restore-databases http://yourcouchdbusername:yourcouchdbpassword@localhost:5984 prod
```
