#!/usr/bin/env bash

if [[ "$1" == "" ]] ; then
  files_to_lint="server tests scripts"
else
  files_to_lint="$@"
fi

eslint --fix $files_to_lint
