#!/usr/bin/env bash

set -eo pipefail

# Usage:
# Dump entities database from config
#   npm run create-entities-dumps
# Dump another entities database by passing an authentified CouchDB database URL
#   npm run create-entities-dumps http://username:password@localhost:5984/entities-prod
#

if [ "$1" != "" ]; then
  entities_db_authentified_url="$1"
else
  entities_db_authentified_url="$(node -p 'require("config").db.getOriginWithAuth() + "/" + require("config").db.name("entities")')"
fi

# Set after $entities_db_authentified_url to allow $1 to be an unbound variable
set -u

directory=$(tsx ./server/lib/absolute_path.ts root dumps/inv)
today=$(date -I)
today_directory="${directory}/${today}"

full_database_export_filename="entities.full.ndjson"
full_database_export_path="${today_directory}/${full_database_export_filename}"

echo "full_database_export_path: $full_database_export_path"

entities_export_filename="entities.ndjson"
entities_export_path="${today_directory}/${entities_export_filename}"

redirections_export_filename="redirections.ndjson"
redirections_export_path="${today_directory}/${redirections_export_filename}"

turtle_export_filename="entities.ttl"
turtle_export_path="${today_directory}/${turtle_export_filename}"

echo "dumps directory: $today_directory"

mkdir -p "$today_directory"

rm -f "$directory/latest"
ln -sr "$today_directory" "$directory/latest"

echo "export entities database: $full_database_export_path"
./scripts/couchdb/export_database_as_ndjson.sh "$entities_db_authentified_url" > "$full_database_export_path"

echo "extracting redirections from $full_database_export_filename into $redirections_export_filename"
cat "$full_database_export_path" | grep '"type":"entity","redirect":' > "$redirections_export_path"

echo "filtering $full_database_export_filename into $entities_export_filename"
cat "$full_database_export_path" |
  # Filter-out removed:placeholders
  grep '"type":"entity"' |
  # Filter-out redirections
  grep --invert-match ',"redirect":' > "$entities_export_path"

echo "converting to turtle: $turtle_export_filename"
cat "$entities_export_path" | ./scripts/dumps/convert_ndjson_dump_to_ttl.ts > "${turtle_export_path}"

validate_ttl(){
  file_path_hash=$(echo $1 | md5sum | awk '{printf $1}')
  log_file="/tmp/ttl_validation_logs_${file_path_hash}"
  # TurtleValidator ttl always exits with 0, thus the need to parse its logs
  # to exit with an error code if an error was detected
  # see https://github.com/IDLabResearch/TurtleValidator/issues/7
  ttl $1 | tee $log_file
  cat $log_file | grep '{ Error' > /dev/null && exit 1
}

validate_ttl "$turtle_export_path" && echo 'validated'

rm "$full_database_export_path"

echo "compressing results"
gzip --best --force "$entities_export_path" "$redirections_export_path" "$turtle_export_path"

echo "done"
