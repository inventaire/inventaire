#!/usr/bin/env bash

set -eu

./scripts/check_node_version.ts
./scripts/entities_extended_types_aliases/check_extended_aliases_freshness.ts

# Make git hooks trackable (see https://stackoverflow.com/a/4457124/3324977)
rm -rf .git/hooks
# Symbolic link is relative to the .git directory, thus the path starting with ".."
ln -s ../scripts/githooks .git/hooks

npm run update-i18n

# Make the server types available to the client
# Needs to be re-executed after changing server types
npm run build

mkdir -p logs run db/leveldb

touch ./logs/server.log ./logs/error.log
# Expected by scripts/actions/backup_databases.ts
mkdir -p ./db/couchdb/backups
# Expected by scripts/test_api.sh
mkdir -p run
# Create folders for when mediaStorage is in local mode (which is the default)
mkdir -p ./storage/users ./storage/groups ./storage/entities
touch run/3006 run/3009

# If the client folder already exist, assume that it's a re-install
# and that all the following isn't needed
[ -e client ] && exit 0

npm run install-client

if [ ! -f ./config/local.cjs ]; then
  # Create a local config file
  emptyConfigFile="
  // Override settings from ./default.cjs in this file
  module.exports = {
    db: {
      username: 'yourcouchdbusername',
      password: 'yourcouchdbpassword',
      port: 5984,
    }
  }
  "
  echo "$emptyConfigFile" >> ./config/local.cjs
  chmod 600 ./config/local.cjs
else
  echo './config/local.cjs file already exist: skipping creation'
fi

# See https://git-scm.com/docs/git-config#Documentation/git-config.txt-blameignoreRevsFile
git config blame.ignoreRevsFile .git-blame-ignore-revs
