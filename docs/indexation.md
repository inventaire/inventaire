# Indexation

Environment:
```sh
# Used to determine
# - CouchDB host, credentials, and databases names
# - Elasticsearch host, and indexes names
# - LevelDB folder (relevant for document formatters relying on cached values)
# Any of those values can be overwritten by setting the corresponding parameter in config/local.cjs
export NODE_ENV=production
```

## Items
```sh
npm run indexation:load-from-couchdb items
```

## Users
```sh
npm run indexation:load-from-couchdb users
```

## Groups
```sh
npm run indexation:load-from-couchdb groups
```

## Shelves
```sh
npm run indexation:load-from-couchdb shelves
```

## Lists
```sh
npm run indexation:load-from-couchdb lists
```

## Entities
### Inventaire entities
```sh
npm run indexation:load-from-couchdb entities
```

### Wikidata entities
```sh
npm run indexation:wikidata:load-from-dump
```

Alternatively, a subset of Wikidata entities can be indexed from a SPARQL query, using [`wikibase-cli`](https://github.com/maxlath/wikibase-cli). For instance, to reindex all languages:

```sparql
# languages.rq
SELECT DISTINCT ?item {
  VALUES (?type) { (wd:Q34770) (wd:Q1288568) (wd:Q38058796) (wd:Q45762) (wd:Q33384) (wd:Q33742) (wd:Q34228) (wd:Q436240) (wd:Q2315359) (wd:Q315) (wd:Q33215) (wd:Q838296) (wd:Q2519134) (wd:Q17376908) (wd:Q838296) (wd:Q1149626) (wd:Q1208380) (wd:Q152559) (wd:Q33289) (wd:Q399495) (wd:Q43091) (wd:Q64362969) (wd:Q839470) }
  ?item wdt:P31 ?type .
}
```

```sh
# 1 - get the desired ids from the Wikidata Query Service
# 2 - get the entities JSON from the Wikidata API
# 3 - format and load in Elasticsearch wikidata index
wd sparql ./languages.rq | wd data | ./scripts/indexation/load.ts wikidata
```
