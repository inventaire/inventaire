#!/usr/bin/env bash

if [[ "$1" == "" ]] ; then
  files_to_lint="server tests scripts"
else
  files_to_lint="$@"
fi

eslint --config .eslintrc.cli.cjs --fix $files_to_lint
