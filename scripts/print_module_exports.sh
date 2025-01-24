#!/usr/bin/env bash

# print_module_exports.ts might import code that triggers undesired logs, especially during debug
# thus the need to filter-out the output to get only the desired JSON
./scripts/print_module_exports.ts $@ | grep -E '^[\{\[]' --color=never
