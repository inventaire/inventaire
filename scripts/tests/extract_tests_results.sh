#!/usr/bin/env bash

# This script outputs the latest tests results to ./logs/tests_results.log
# which can then conveniently be kept open and edited in a text editor.
# This is especially useful when working with many failing tests that need to be fixed
# rather than having to scroll in a terminal

set -eu

source ./scripts/scripts_utils.sh

extract_mocha_results(){
  grep --extended-regexp '^  [[:digit:]]+ passing \(' --after-context 1000000 --color=never
}

drop_ansi_colors < ./logs/tests.log | extract_mocha_results > ./logs/tests_results.log
