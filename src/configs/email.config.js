// Email configuration
// Base: EMAIL_CONFIG_*
const BASE = 'EMAIL_CONFIG_';
export default {
  provider: process.env[`${BASE}PROVIDER`],
  authentication: {
    username: process.env[`${BASE}SMTP_USER`],
    password: process.env[`${BASE}SMTP_PWD`],
  },
  sender: process.env[`${BASE}SENDER`],
  emails: {
    support: process.env[`${BASE}EMAIL_SUPPORT`],
  },
  mailgun: {
    apiKey: process.env[`${BASE}MAILGUN_KEY`],
    publicApiKey: process.env[`${BASE}MAILGUN_PUBLIC_KEY`],
    domain: process.env[`${BASE}MAILGUN_DOMAIN`],
  },
};
