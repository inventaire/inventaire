#!/usr/bin/env bash
set -eu

which elasticdump > /dev/null || {
  echo "requires to have https://www.npmjs.com/package/elasticdump installed, either globally or just in this repo"
  echo "(it is not installed as a dev dependency as the use made of it is not worth the subdependencies maintainance)"
  exit 1
}

es_host=$(node -p "require('config').elasticsearch.host")
inv_entities_index=$(node -p "require('config').entitiesSearchEngine.indexes.inventaire")
wd_entities_index=$(node -p "require('config').entitiesSearchEngine.indexes.wikidata")
dump_folder=./dumps

mkdir -p "$dump_folder"

export_index_base(){
  index=$1
  type=$2
  name="${index}_${type}"
  output="${dump_folder}/${name}.json.bz2"

  echo -e "\e[0;30mexporting ${name}\e[0m"

  elasticdump \
    --input="${es_host}/${index}" \
    --output='$' \
    --type="$type" \
    | pbzip2 -c > "$output"

  echo -e "\e[0;32mdone exporting ${name}\e[0m"
}

export_index(){
  index=$1
  export_index_base "$index" 'mapping'
  export_index_base "$index" 'data'
}

export_index "$inv_entities_index"
export_index "$wd_entities_index"
