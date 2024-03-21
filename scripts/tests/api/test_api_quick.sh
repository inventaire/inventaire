#!/usr/bin/env bash

# Same as ./test_api but without deleting the databases and restarting the server
# each times: can be used to quickly run tests that don't need a complete
# environement reboot. Typically, such a dependency is due to an operation that
# isn't offered by the API at the moment (as those tests don't use as little
# server libs/controllers as possible).
# Known case: deleting an entity isn't possible from the API

# Env variables required to get the right port
export NODE_ENV=tests-api NODE_APP_INSTANCE=server
# Use `toString` to prevent getting colored output
server_port=$(node -p "require('config').port.toString()")
watcher_pid=$(pgrep --full "watcher_server_port_${server_port}")

if [ -n "$watcher_pid" ];
then
  echo -e "\e[0;32mtests server is running: see logs in ./logs/test-server.log\e[0;30m"
else
  ./scripts/tests/api/start_tests_server.sh
fi

./scripts/tests/api/run_api_tests.sh $@
