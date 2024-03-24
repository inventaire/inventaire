#!/usr/bin/env bash

# source: https://stackoverflow.com/a/18000433
drop_ansi_colors(){
  sed -r "s/\x1B\[([0-9]{1,3}(;[0-9]{1,2})?)?[mGK]//g"
}

file_path_timestamp(){
  node -p 'new Date().toISOString().replace(/[:.]/g, "-")'
}
