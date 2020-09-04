## Wikidata filtered-dump import

```sh
# the wikidata claim that entities have to match to be in the subset
claim=P31:Q5
# the type that will be passed to ElasticSearch 'wikidata' index
datatype=humans

./bin/dump_wikidata_subset $claim $datatype
# time for a coffee!
```
What happens here:
* we download the latest [Wikidata dump](https://www.wikidata.org/wiki/Wikidata:Database_download#JSON_dumps_.28recommended.29)
* pipe it to [wikidata-filter](https://github.com/maxlath/wikidata-filter) to keep only entities matching the claim `P31:Q5` and keeping only the entities attributes required by a full-text search engine, that is: `id`, `labels`, `aliases`, `descriptions`
* pipe those filtered entities to ElasticSearch `wikidata` index under the datatype `humans`, making those entities searchable from the endpoint `http://localhost:9200/wikidata/humans/_search` (see [ElasticSearch API doc](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-search.html))

:warning: *you are about to download a whole Wikidata dump that is something like 13GB compressed. Only the filtered output should be written to your disk though.*

### Import multiple Wikidata subsets into ElasticSearch

The same as the above but saving the Wikdiata dump to disk to avoid downloading 13GB multiple times when one time would be enough. This time, you do need the 13GB disk space, plus the space that will take your subsets in ElasticSearch
```sh
alias wdfilter=./node_modules/.bin/wikibase-dump-filter
alias import_to_elastic=./scripts/entities_indexation/import_to_elasticsearch.js

curl -s https://dumps.wikimedia.org/wikidatawiki/entities/latest-all.json.gz > wikidata-dump.json.gz

cat wikidata-dump.json.gz | gzip -d | wdfilter --claim P31:Q5 --omit type,sitelinks | import_to_elastic humans
# => will be available at http://localhost:9200/wikidata/humans

cat wikidata-dump.json.gz | gzip -d | wdfilter --claim P31:Q571 --omit type,sitelinks | import_to_elastic books
# => will be available at http://localhost:9200/wikidata/books
```

**Tip**
If importing a dump fails at some point, rather than re-starting from 0, you can use the [`start-from`](https://github.com/maxlath/start-from) command to restart from the latest known line.
Example:
```sh
cat wikidata-dump.json.gz | gzip -d | start-from '"Q27999075"' | ./node_modules/.bin/wikibase-dump-filter --claim P31:Q5 --omit type,sitelinks | ./scripts/entities_indexation/import_to_elasticsearch.js humans
```
