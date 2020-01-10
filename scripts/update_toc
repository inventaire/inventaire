#!/usr/bin/env bash
which doctoc && {
  doctoc README.md
} || {
  echo "requires to have https://www.npmjs.com/package/doctoc installed, either globally or just in this repo"
  echo "(it is not installed as a dev dependency as the use made of it it's not worth the subdependencies maintainance)"
  exit 1
}
