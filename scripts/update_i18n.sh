#!/usr/bin/env bash
set -eu

if [ -e pnpm-lock.yaml ]; then
  pnpm i git+https://github.com/inventaire/inventaire-i18n.git
else
  npm i git+https://github.com/inventaire/inventaire-i18n.git
fi

cd node_modules/inventaire-i18n
npm run build
