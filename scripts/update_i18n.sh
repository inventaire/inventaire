#!/usr/bin/env bash
set -eu

[ -e inventaire-i18n ] || {
  git clone https://github.com/inventaire/inventaire-i18n.git
}

cd ./inventaire-i18n
rm -rf ./dist
git checkout origin/main
git checkout -B main
git pull origin main
npm run build
cd ..
