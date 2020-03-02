let sendMail
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')

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

const { defaultFrom, preview } = CONFIG.mailer
const defaults =
  { from: defaultFrom }

const transporter = nodemailer.createTransport(CONFIG.mailer, defaults)

if (preview) {
  // overriding Nodemailer::sendMail to generate a preview file
  // instead of sending the email
  sendMail = require('./preview_email')
  transporter.sendMail = sendMail.bind(transporter)
}

transporter.use('compile', hbs(options))

module.exports = {
  sendMail: async email => {
    return transporter.sendMail(email)
    .then(_.Success('email sent'))
    .catch(err => {
      _.error(err, 'email error')
      return _.warn(email, 'associated email')
    })
  }
}
