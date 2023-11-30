#!/usr/bin/env bash

export NODE_ENV=dev

./scripts/watch.sh |
  # Print logs in both the terminal and this log file
  # to be able to do operations on the logs (grep, less, etc)
  tee ./logs/dev-server.log
