#!/usr/bin/env bash

# This script can be used to prevent a slow server start by refreshing
# the entities type extended aliases before restarting the server

export INV_REFRESH_ENTITIES_TYPE_EXTENDED_ALIASES=true
tsx server/lib/wikidata/extended_aliases.ts
