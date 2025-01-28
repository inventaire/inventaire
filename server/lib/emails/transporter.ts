import { isPlainObject } from 'lodash-es'
import { createTransport, getTestMessageUrl } from 'nodemailer'
import hbs from 'nodemailer-express-handlebars'
import { absolutePath } from '#lib/absolute_path'
import { debug, imgSrc, stringify } from '#lib/emails/handlebars_helpers'
import { i18n, I18n, dateI18n } from '#lib/emails/i18n/i18n'
import { warn, success, logError } from '#lib/utils/logs'
import config, { defaultFrom } from '#server/config'

const viewsPath = absolutePath('lib', 'emails/views')
const debugMode = config.mailer.nodemailer.host === 'smtp.ethereal.email'

const dropHandlebarsContext = fn => (...args) => {
  const lastArg = args.at(-1)
  if (isPlainObject(lastArg) && isPlainObject(lastArg.data) && isPlainObject(lastArg.hash)) {
    args = args.slice(0, -1)
  }
  return fn(...args)
}

const options = {
  viewEngine: {
    extname: '.hbs',
    layoutsDir: `${viewsPath}/layouts/`,
    defaultLayout: 'template',
    partialsDir: `${viewsPath}/partials/`,
    helpers: {
      debug,
      imgSrc: dropHandlebarsContext(imgSrc),
      stringify,
      i18n: dropHandlebarsContext(i18n),
      I18n: dropHandlebarsContext(I18n),
      dateI18n: dropHandlebarsContext(dateI18n),
    },
  },
  viewPath: viewsPath,
  extName: '.hbs',
}

const { nodemailer: nodemailerOptions } = config.mailer
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
