// Time.js
/*
  Handle host configuration checks and  and load configuration to
  one object.
*/

const moment = require('moment'); // eslint-disable-line
const printf = require('util').format; // eslint-disable-line
let current = 0;
// Get util timestamp
exports.timestamp = () => (new Date().getTime());

// Get time in string
exports.toString = () => {
  const d = moment();
  return d.format('YYYY-MM-DD-HHmmss');
};

// Record time
exports.start = () => {
  current = (new Date()).getTime();
};

// Stop and get ellapse time
exports.stop = () => printf('%d%s', ((new Date()).getTime() - current), 'ms');
