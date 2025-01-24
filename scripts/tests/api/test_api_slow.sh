#!/usr/bin/env bash

# In case they were running
./scripts/tests/api/kill_tests_server.sh
# Deleting databases before the tests, so that tests can be run individually
# without having to check for the databases existance, as those will not have
# been deleted at the end of the tests
./scripts/tests/api/delete_tests_databases.sh &&
./scripts/tests/api/start_tests_server.sh &&
./scripts/tests/api/run_api_tests.sh $@

# Kill server, even if the tests fails
./scripts/tests/api/kill_tests_server.sh
