// statistic.js
/*
  Statistic retrieve or stored
*/
import appLog from '../utils/log';

const _ = require('lodash');
const later = require('later');

/**
 * Method handle permission
 */
exports.run = (schedules) => {
  _.each(schedules, (k) => {
    require(`${k}.js`).run(later); // eslint-disable-line
    // Root.require(`root/class/lib/schedules/${k}.js`).run(later);
  });
  schedules = schedules.length > 0 ? schedules : ['(null)'];
  appLog.info(`[schedule] schedules started for ${schedules.join(', ')}`);
};
