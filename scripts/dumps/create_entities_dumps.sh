#!/usr/bin/env bash

set -euo pipefail

# Usage:
#   npm run create-dumps http://username:password@localhost:5984/entities-prod
#

entities_db_authentified_url="$1"

folder=$(node ./server/lib/absolute_path.js root dumps/inv)
today=$(date -I)
today_folder="${folder}/${today}"

full_database_export_filename="entities.full.ndjson"
full_database_export_path="${today_folder}/${full_database_export_filename}"

echo "full_database_export_path: $full_database_export_path"

entities_export_filename="entities.ndjson"
entities_export_path="${today_folder}/${entities_export_filename}"

redirections_export_filename="redirections.ndjson"
redirections_export_path="${today_folder}/${redirections_export_filename}"

turtle_export_filename="entities.ttl"
turtle_export_path="${today_folder}/${turtle_export_filename}"

echo "dumps folder: $today_folder"

mkdir -p "$today_folder"

rm -f "$folder/latest"
ln -sr "$today_folder" "$folder/latest"

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
cat "$entities_export_path" | ./scripts/dumps/convert_ndjson_dump_to_ttl.js > "${turtle_export_path}"

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
