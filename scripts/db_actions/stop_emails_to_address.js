#!/usr/bin/env coffee
__ = require('config').universalPath
{ stopEmails } = __.require 'controllers', 'invitations/lib/invitations'
actionByEmail = require './lib/action_by_email'
actionByEmail stopEmails
