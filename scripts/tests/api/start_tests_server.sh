#!/usr/bin/env bash

# Use NODE_APP_INSTANCE=tests-alt to override local config with local-tests-alt
export NODE_ENV=tests-api NODE_APP_INSTANCE=server

echo -e "\e[0;34mStarting test server in the background: see logs in ./logs/test-server.log\e[0;30m"
./scripts/watch.sh > logs/test-server.log 2>&1 &
