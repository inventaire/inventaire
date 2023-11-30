#!/usr/bin/env bash
set -eu

# Compiling the project rather than JIT transpiling with ts-node
# to speed-up the server restart time

rm -rf ./dist
tsc  --project ./tsconfig.build.json --diagnostics

# Copying package.json allows to redefine the root path and all import aliases
# Ex: '#lib/requests' needs to resolve to ./dist/server/lib/requests.js
ln -s "$(realpath package.json)" ./dist

# tsc will have created a build/inventaire-i18n folder with the files imported
# within the code base, but lacking the i18n json, which are then required by the static server
rm -rf ./dist/inventaire-i18n
ln -sf "$(realpath inventaire-i18n)" ./dist

ln -s "$(realpath client)" ./dist
