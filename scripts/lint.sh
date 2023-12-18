#!/usr/bin/env bash

if [[ "$1" == "" ]] ; then
  files_to_lint="server tests scripts"
else
  files_to_lint="$@"
fi

eslint $files_to_lint
