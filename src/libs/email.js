// email.js
/*
Send email libraries
*/
import config from '../configs';
import util from '../utils';
import log from '../utils/log';

const assert = require('assert');
const validator = require('validator');
// const nodemailer = require('nodemailer');
const fs = require('fs');
const _ = require('underscore');
const Mailgun = require('mailgun-js');

let configOptions = null;

const Lib = {};
const thunkedRead = util.promisify(fs.readFile, fs);
let mg;

const formatEmail = (text, obj) => {
  // eslint-disable-next-line
  for (const key in obj) {
    const val = obj[key];
    const reg = new RegExp(`@${key}`, 'g');
    text = text.replace(reg, val);
  }
  return text;
};

const __send = (data) => {
  const emails = data.to.split(',');
  // eslint-disable-next-line
  for (const index in emails) {
    const email = emails[index].trim();
    assert(validator.isEmail(email), `EmailService - Invalid address to send to, ${email}`);
  }
  if (!data.html) {
    assert(data.templateName, 'EmailService - Missing templateName to render');
    if (data.model) {
      assert(_.isObject(data.model), 'EmailService - Invalid model to replace');
    }
  }
};

Lib.init = (opts) => {
  configOptions = config.get('email');
  if (opts) {
    configOptions = Object.assign(configOptions, opts);
  }
  if (configOptions) {
    mg = Mailgun({
      apiKey: configOptions.mailgun.apiKey,
      domain: configOptions.mailgun.domain,
    });
  }
};

/**
 * data should contain { to, subject, templateName, model }
 */
Lib.send = async (data) => {
  if (!mg) {
    Lib.init();
  }
  const promise = new Promise(async (resolve, reject) => {
    try {
      data = data || {};
      __send(data);
      data.from = data.from || configOptions.sender;

      if (!data.html) {
        let template = await thunkedRead(data.templateName);
        template = template.toString();
        if (data.model) {
          template = formatEmail(template, data.model);
        }
        data.html = template;
      }
      // else the template are already in html

      // Invokes the method to send emails given the above data with the helper library
      mg.messages().send(data, (err, body) => {
        // If there is an error, render the error page
        if (err) {
          log.log('got an error while sending email: ', err);
          resolve(err);
        } else { // Else we can greet and leave
          log.log('email sent', body);
          resolve(body);
        }
      });
    } catch (e) {
      log.error(`[email] send: ${e.message}`, e.stack);
      log.error('error.log', e.message, e.stack);
      reject(e);
    }
  });
  return promise;
};

/**
 * data should contain user, merchant
 */
Lib.queue = async () => {
  if (!mg) {
    Lib.init();
  }
};

export default Lib;
