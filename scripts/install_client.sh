#!/usr/bin/env bash
[ -e client ] || git clone https://codeberg.org/inventaire/inventaire-client.git ./client
cd client
npm install
