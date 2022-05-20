import config from '../configs';
import log from '../utils/log';

const plivo = require('plivo');
const assert = require('assert');

let p = null;
const Lib = {};

/**
 * Initialize payment
 * @param {*} opts Options configuration ex: { authId: 'ABC', 'authToken': 'ABC' }
 */
Lib.init = (opts) => {
  let configOptions = config.get('sms');
  if (opts) {
    configOptions = Object.assign(configOptions, opts);
  }
  p = new plivo.Client(configOptions.authId, configOptions.authToken);
  return p;
};

/**
 * Send message via plivo
 * @param {*} number Number to send to
 * @param {*} message Message to send to
 * @param {*} senderId Sender ID sent from
 */
Lib.send = async (number, message, senderId) => {
  if (!p) {
    Lib.init();
  }
  const params = {
    src: senderId,
    dst: number,
    text: message,
  };

  assert(p, 'Plivo is not initialised');

  const result = await p.messages.create(
    params.src,
    params.dst,
    params.text,
  );
  return result;
};

export default Lib;
