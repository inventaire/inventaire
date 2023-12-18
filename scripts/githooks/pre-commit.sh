#!/usr/bin/env bash

set -eu

echo -e "\e[0;30mstarting to lint...\e[0m"
npm run lint-staged

git status --porcelain -- package.json jsconfig.json scripts/update_jsconfig.js | grep --extended-regexp "^ ?M" > /dev/null && {
  echo -e "\e[0;30mupdating jsconfig.json...\e[0m"
  npm run update-jsconfig
} || true
