#!/usr/bin/env bash
files=$1
export NODE_ENV=tests-unit
if [ "$files" != "" ] ; then
  mocha --exit $MOCHA_OPTIONS --recursive "$files"
else
  mocha --exit $MOCHA_OPTIONS --recursive ./tests/unit
fi
