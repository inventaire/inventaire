#!/usr/bin/env bash
[ -z "$NODE_ENV" ] && export NODE_ENV=dev

# Use `toString` to prevent getting colored output
server_port=$(node -p "require('config').port.toString()")
# supervisor pid is used by scripts/tests/api
supervisor_pid_file="./run/${server_port}-supervisor"

export FORCE_COLOR=true

supervisor \
  --watch server,config \
  --no-restart-on error \
  --save-pid "$supervisor_pid_file" \
  --extensions js,json,hbs \
  server/server.js |
  # Print logs in both the terminal and this log file
  # to be able to do operations on the logs (grep, less, etc)
  tee ./logs/dev-server.log
