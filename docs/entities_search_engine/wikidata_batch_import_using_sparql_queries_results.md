## Wikidata batch import using SPARQL queries results

* Write a SPARL query `SELECT`ing only one variable (with no label) that should output the ids of the entities you would like to import. Save this query in the folder `queries/sparql/${type}.rq` with, *type* being the type you would like it to have in Elasticsearch. Hereafter, `type=works`

* Run the query: `npm run indexation:entities:update-query-results works`. This will save the corresponding ids into `queries/results/works.json`

* Import the results: `npm run indexation:entities:import-query-results works`

Both commands can be passed `all` instead of a list of types to run all the queries in the `queries/sparql` folder, and import all the results from `queries/results` in Elasticsearch, via the server.
