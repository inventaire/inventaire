# External email provider

Inventaire must send email to confirm account creation. A mailer service is also optional to send the automatic newsletter.

## In production

### About the email server provider

Any service providing an SMTP server may fit (for information, inventaire.io is using Sendgrid).
Make sure the appropriate ports are not blocked by the provider.

### Setup the inventaire config

In `config/local.cjs`:

```js
module.exports = {
	...
	mailer: {
		disabled: false,
		nodemailer: {
		  host: 'smtp.provider-domain.org',
		  // Conventional port (587) may be customized
		  port: 587,
		  auth: {
		    user: 'your-provider-username',
		    pass: 'your-provider-password'
		  },
		},
	}
	...
}
```

### Test the service

Once setup, on may send a test email with the following command:

```sh
npm run send-test-email your@email.org
```

## In development

In case one would like to test a setup, check out [ethereal](https://ethereal.email/create).