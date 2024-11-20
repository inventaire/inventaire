#!/usr/bin/env bash
databases=$(./scripts/print_module_exports.ts server/db/couchdb/databases.ts databases | jq 'keys | join(" ")' -r)
couchdb_origin=$(node -p "require('config').db.getOrigin()")
elastic_origin=$(node -p "require('config').elasticsearch.origin")
leveldb_path_base=$(tsx ./server/lib/absolute_path.ts root db/leveldb)
leveldb_path="${leveldb_path_base}*-tests"

echo "Delete databases: $databases"

if [ "$INV_DELETE_TESTS_DATABASES" != "1" ] ; then
  echo -n "Continue? y/N "
  read response
  if [ "$response" != 'y' ] ; then
    echo 'Stopped by user'
    exit 1
  fi
fi

for db in $databases
do
  echo "deleting ${db}-tests in couchdb... " &&
  curl -sXDELETE "${couchdb_origin}/${db}-tests"
  echo "deleting ${db}-tests in elastic search... " &&
  curl -sXDELETE "${elastic_origin}/${db}-tests"
done

echo "deleting ${leveldb_path}... " &&
rm -rf ${leveldb_path}
