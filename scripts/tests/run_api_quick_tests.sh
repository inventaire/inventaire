#!/usr/bin/env bash
./scripts/tests/api/test_api_quick.sh $@ | tee ./logs/tests.log
./scripts/tests/extract_tests_results.sh
