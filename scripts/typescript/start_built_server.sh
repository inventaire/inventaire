#!/usr/bin/env bash
set -eu

# Requires ./scripts/typescript/build.sh to have populated the ./dist directory

cd ./dist
node ./server/server.js
