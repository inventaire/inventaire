#!/usr/bin/env coffee
__ = require('config').universalPath
{ incrementUndeliveredMailCounter } = __.require 'controllers', 'user/lib/user'
actionByEmail = require './lib/action_by_email'
actionByEmail incrementUndeliveredMailCounter
