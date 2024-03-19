#!/usr/bin/env bash
set -eu

# Compiling the project rather than JIT transpiling with ts-node
# to speed-up the server restart time

rm -rf ./dist
tsc  --project ./tsconfig.build.json --diagnostics

# Copying package.json allows to redefine the root path and all import aliases
# Ex: '#lib/requests' needs to resolve to ./dist/server/lib/requests.js
ln -s "$(realpath package.json)" ./dist

ln -s "$(realpath config)" ./dist

ln -s "$(realpath client)" ./dist
