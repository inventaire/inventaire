#!/usr/bin/env bash
set -eu

# Compiling the project rather than JIT transpiling with ts-node
# to speed-up the server restart time

rm -rf ./dist/{server,types,tsconfig.build.tsbuildinfo}

# Use a temporay pre-dist folder to avoid rm -rf symlinks defined hereafter
# as that could mess with currently running LevelDB operations
tsc  --project ./tsconfig.build.json --diagnostics --outDir ./pre-dist
# .hbs files are not copied by tsc
# See https://github.com/microsoft/TypeScript/issues/30835
cp -r server/lib/emails/views ./dist/server/lib/emails

mv ./pre-dist/* ./dist
rmdir ./pre-dist

# Copying package.json allows to redefine the root path and all import aliases
# Ex: '#lib/requests' needs to resolve to ./dist/server/lib/requests.js
ln -sf "$(realpath package.json)" ./dist
ln -sf "$(realpath config)" ./dist
ln -sf "$(realpath client)" ./dist
ln -sf "$(realpath db)" ./dist
