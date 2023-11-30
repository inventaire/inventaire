#!/usr/bin/env bash

set -eu

echo -e "\e[0;30mstarting to lint...\e[0m"
npm run lint-staged
