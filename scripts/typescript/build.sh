#!/usr/bin/env bash
set -eu

mkdir -p ./dist

# Compiling the project rather than JIT transpiling with ts-node
# to speed-up the server restart time

rm -rf ./dist/server

# Always use the same directory to find the previous tsbuildinfo file
tmpdir="/tmp/inv-pre-dist"

# Use a temporay pre-dist folder to avoid rm -rf symlinks defined hereafter
# as that could mess with currently running LevelDB operations
tsc  --project ./tsconfig.build.json --diagnostics --outDir "$tmpdir"
# .hbs files are not copied by tsc
# See https://github.com/microsoft/TypeScript/issues/30835
cp -r server/lib/emails/views "$tmpdir/server/lib/emails"

cp -r $tmpdir/server ./dist

# Copying package.json allows to redefine the root path and all import aliases
# Ex: '#lib/requests' needs to resolve to ./dist/server/lib/requests.js
ln -sf "$(realpath package.json)" ./dist
ln -sf "$(realpath config)" ./dist
ln -sf "$(realpath client)" ./dist
ln -sf "$(realpath db)" ./dist
