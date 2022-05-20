const BASE = 'SMS_CONFIG_';
export default {
  sid: '',
  number_sid: '',
  'auth-token': '',
  from: '',
  sender_id: false,
  authId: process.env[`${BASE}AUTH_ID`],
  authToken: process.env[`${BASE}AUTH_TOKEN`],
};
