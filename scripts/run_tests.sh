#!/usr/bin/env bash

set -e

filter_files(){
  local filter=$1
  local file_names="${*:2}"
  echo "$file_names" | tr ' ' '\n' | grep "$filter" | tr '\n' ' '
}

{
  if [ -z "$1" ]; then
    # If no test file is passed as argument, run all tests
    echo "Starting unit tests"
    ./scripts/run_unit_tests.sh
    echo "Starting integration tests"
    ./scripts/run_integration_tests.sh
    echo "Starting API tests"
    ./scripts/tests/api/test_api.sh
  else
    unit_tests_files=$(filter_files "tests/unit/" "$@")
    [ "$unit_tests_files" != "" ] && {
      echo "Run unit tests from $unit_tests_files"
      ./scripts/run_unit_tests.sh $unit_tests_files
    }

    integration_tests_files=$(filter_files "tests/integration/" "$@")
    [ "$integration_tests_files" != "" ] && {
      echo "Run integration tests from $integration_tests_files"
      ./scripts/run_integration_tests.sh $integration_tests_files
    }

    api_tests_files=$(filter_files "tests/api/" "$@")
    [ "$api_tests_files" != "" ] && {
      echo "Run API tests from $api_tests_files"
      ./scripts/tests/api/test_api_quick.sh $api_tests_files
    }

    true
  fi
} | tee ./logs/tests.log

./scripts/extract_tests_results.sh
