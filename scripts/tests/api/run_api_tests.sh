#!/usr/bin/env bash

export NODE_ENV=tests-api NODE_APP_INSTANCE=mocha

# Use `toString` to prevent getting colored output
timeout=$(node -p 'require("config").mocha.timeout.toString()')

# If no test file is passed as argument, run all tests
if [ -z "$1" ]
then
  mocha --exit $MOCHA_OPTIONS --timeout "$timeout" --recursive ./tests/api
else
  mocha --exit $MOCHA_OPTIONS --timeout "$timeout" --color --recursive "$@"
fi
