CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'

nodemailer = require 'nodemailer'
hbs = require 'nodemailer-express-handlebars'
handlebarsHelpers = require './handlebars_helpers'
viewsPath = __.path 'lib', 'emails/views'

options =
  viewEngine:
    extname: '.hbs'
    layoutsDir: "#{viewsPath}/layouts/"
    defaultLayout: 'template'
    partialsDir: "#{viewsPath}/partials/"
    helpers: handlebarsHelpers
  viewPath: viewsPath
  extName: '.hbs'

{ defaultFrom, preview } = CONFIG.mailer
defaults =
  from: defaultFrom

transporter = nodemailer.createTransport CONFIG.mailer, defaults

if preview
  # overriding Nodemailer::sendMail to generate a preview file
  # instead of sending the email
  sendMail = require './preview_email'
  transporter.sendMail = sendMail.bind transporter

transporter.use 'compile', hbs(options)

module.exports =
  sendMail: (email)->
    transporter.sendMail email
    .then _.Success('email sent')
    .catch (err)->
      _.error err, 'email error'
      _.warn email, 'associated email'
