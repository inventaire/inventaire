import CONFIG from 'config'
import { createTransport, getTestMessageUrl } from 'nodemailer'
import hbs from 'nodemailer-express-handlebars'
import { absolutePath } from '#lib/absolute_path'
import { warn, success, logError } from '#lib/utils/logs'
import handlebarsHelpers from './handlebars_helpers.js'

const viewsPath = absolutePath('lib', 'emails/views')
const debugMode = CONFIG.mailer.nodemailer.host === 'smtp.ethereal.email'

const options = {
  viewEngine: {
    extname: '.hbs',
    layoutsDir: `${viewsPath}/layouts/`,
    defaultLayout: 'template',
    partialsDir: `${viewsPath}/partials/`,
    helpers: handlebarsHelpers,
  },
  viewPath: viewsPath,
  extName: '.hbs',
}

const { defaultFrom, nodemailer: nodemailerOptions } = CONFIG.mailer
const defaults = { from: defaultFrom }

const transporter = createTransport(nodemailerOptions, defaults)

transporter.use('compile', hbs(options))

export async function sendMail (email) {
  const { template, subject } = email
  try {
    const info = await transporter.sendMail(email)
    const inspectUrl = debugMode ? ` inspect="${getTestMessageUrl(info)}"` : ''
    success(info, `email sent (template="${template}" subject="${subject}"${inspectUrl})`)
  } catch (err) {
    logError(err, `email error (template="${template}" subject="${subject}")`)
    return warn(email, 'associated email')
  }
}
