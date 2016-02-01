#!/usr/bin/env coffee
# require it before to override the config
actionByEmail = require './lib/action_by_email'
__ = require('config').universalPath
invitations_ = __.require 'controllers', 'invitations/lib/invitations'
actionByEmail invitations_.stopEmails
