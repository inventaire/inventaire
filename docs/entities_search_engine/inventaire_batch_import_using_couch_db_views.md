## Inventaire batch import using CouchDB views

Using [`couch-view-by-keys`](https://github.com/maxlath/couchdb-view-by-keys) `>= v4`

```sh
COUCHDB_AUTH_HOST=http://username:password@localhost:5984
# Using the same name for the CouchDB database and the Elasticsearch index
ENTITIES_DB_NAME=entities-prod
DB="$COUCHDB_AUTH_HOST/$ENTITIES_DB_NAME"

couchdb-view-by-keys --docs $DB/_design/entities/_view/byClaim "['wdt:P31', 'wd:Q5']" | ./scripts/entities_indexation/import_to_elasticsearch.js humans
couchdb-view-by-keys --docs $DB/_design/entities/_view/byClaim "['wdt:P31', 'wd:Q571']" | ./scripts/entities_indexation/import_to_elasticsearch.js works
couchdb-view-by-keys --docs $DB/_design/entities/_view/byClaim "['wdt:P31', 'wd:Q277759']" | ./scripts/entities_indexation/import_to_elasticsearch.js series
couchdb-view-by-keys --docs $DB/_design/entities/_view/byClaim "['wdt:P31', 'wd:Q2085381']" | ./scripts/entities_indexation/import_to_elasticsearch.js publishers
couchdb-view-by-keys --docs $DB/_design/entities/_view/byClaim "['wdt:P31', 'wd:Q20655472']" | ./scripts/entities_indexation/import_to_elasticsearch.js collections
```
