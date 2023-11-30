#!/usr/bin/env bash
set -e

# Use `toString` to prevent getting colored output
server_port=$(node -p "require('config').port.toString()")

export FORCE_COLOR=true

# Hijack the --ignore argument to declare which server port will be used
# in order to let other process find the desired nodemon process id with `pkill --full`
nodemon \
  --watch server --watch config \
  --ext js,cjs,ts,json,hbs \
  --exec 'ts-node' \
  --exitcrash \
  --ignore "nodemon_server_port_${server_port}" \
  server/server.ts
