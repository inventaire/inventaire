#!/usr/bin/env bash
CHANGED=$(git diff $1 $2 --stat package-lock.json)
if [[ -n $CHANGED ]]
then
    echo "△  Warning: package.json has changed."
    echo "△  You may want to run 'npm install'."
fi
