const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = require('builders/utils')

const nodemailer = require('nodemailer')
const hbs = require('nodemailer-express-handlebars')
const handlebarsHelpers = require('./handlebars_helpers')
const viewsPath = __.path('lib', 'emails/views')

const options = {
  viewEngine: {
    extname: '.hbs',
    layoutsDir: `${viewsPath}/layouts/`,
    defaultLayout: 'template',
    partialsDir: `${viewsPath}/partials/`,
    helpers: handlebarsHelpers
  },
  viewPath: viewsPath,
  extName: '.hbs'
}

const { defaultFrom, nodemailer: nodemailerOptions } = CONFIG.mailer
const defaults = { from: defaultFrom }

const transporter = nodemailer.createTransport(nodemailerOptions, defaults)

transporter.use('compile', hbs(options))

module.exports = {
  sendMail: async email => {
    const { template, subject } = email
    return transporter.sendMail(email)
    .then(_.Success(`email sent (template="${template}" subject="${subject}")`))
    .catch(err => {
      _.error(err, `email error (template="${template}" subject="${subject}")`)
      return _.warn(email, 'associated email')
    })
  }
}
