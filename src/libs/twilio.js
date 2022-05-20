import util from '../utils/index';

const twilio = require('twilio');

/**
 * Initialise twilio configuration
 * @param {*} opts Options configuration. Ex: { sid: 'SID', auth_token: '', sender_id: '', from: '' }
 */
exports.setup = (opts) => {
  const client = twilio(opts.sid, opts.auth_token);
  return {
    client,
    methods: {
      sendMessage: util.promisify(client.messages.create, client.messages),
    },
    from: opts.sender_id ? opts.sender_id : opts.from,
  };
};
