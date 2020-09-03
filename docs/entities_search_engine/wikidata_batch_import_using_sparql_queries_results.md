## Wikidata batch import using SPARQL queries results

* Write a SPARL query `SELECT`ing only one variable (with no label) that should output the ids of the entities you would like to import. Save this query in the folder `queries/sparql/${type}.rq` with, *type* being the type you would like it to have in ElasticSearch.

* Run the query: `npm run update-query-results type-a type-b`. This will save the corresponding ids into `queries/results/${type}.json`

* Add the type name to the server type allowlist by adding it to `./config/default.js` types list

* After starting the server (see above), import the results: `npm run import-query-results type-a type-b`

Both commands can be passed `all` instead of a list of types to run all the queries in the `queries/sparql` folder, and import all the results from `queries/results` in ElasticSearch, via the server.
