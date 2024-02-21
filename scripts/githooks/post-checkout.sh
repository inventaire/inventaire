#!/usr/bin/env bash
CHANGED=$(git diff $1 $2 --stat package-lock.json)
if [[ -n $CHANGED ]]
then
    echo -e "\e[0;33m△  Warning: package-lock.json has changed between ${1:0:7} and ${2:0:7}"
    echo -e "\e[0;33m△  You may want to run 'npm install'.\e[0m"
fi
