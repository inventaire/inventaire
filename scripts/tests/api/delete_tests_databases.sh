#!/usr/bin/env bash
databases=$(./scripts/print_module_exports.js server/db/couchdb/databases.js databases | jq 'keys | join(" ")' -r)
dbHost=$(node -p "require('config').db.getOrigin()")
elasticOrigin=$(node -p "require('config').elasticsearch.origin")
leveldbPathBase=$(node ./server/lib/absolute_path.js root db/leveldb)
leveldbPath="${leveldbPathBase}*-tests"

for db in $databases
do
  echo "\ndeleting ${db}-tests in couchdb... " &&
  curl -sXDELETE "${dbHost}/${db}-tests"
  echo "\ndeleting ${db}-tests in elastic search... " &&
  curl -sXDELETE "${elasticOrigin}/${db}-tests"
done

echo "\ndeleting ${leveldbPath}... " &&
rm -rf ${leveldbPath}
