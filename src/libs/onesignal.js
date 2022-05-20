import * as OneSignal from 'onesignal-node';

import config from '../configs';

// const assert = require('assert');
let configOptions;
let oneSignalClient;
const Lib = {};

/**
 * Initialize
 * @param {userAuthKey, appAuthKey, appId} opts
 */
Lib.init = (opts) => {
  configOptions = config.get('onesignal');
  if (opts) {
    configOptions = Object.assign(configOptions, opts);
  }

  oneSignalClient = new OneSignal.Client({
    userAuthKey: configOptions.userAuthKey,
    app: {
      appAuthKey: configOptions.appAuthKey,
      appId: configOptions.appId
    }
  });
};

/**
 *
 * @param {includePlayerIds, filters, includedSegments, excludedSegments} sendTo
 * @param {contents, data, headings, sendAfter} body
 */
Lib.sendNotification = async (sendTo, body) => {
  if (!configOptions) {
    Lib.init();
  }

  const contentsObj = body.contents && typeof body.contents === 'object' ? {
    contents: body.contents
  } : {};

  const dataObj = body.data && typeof body.data === 'object' ? {
    data: body.data
  } : {};

  const headingsObj = body.headings && typeof body.headings === 'object' ? {
    headings: body.headings
  } : {};

  const sendAfterObj = body.sendAfter ? {
    send_after: body.sendAfter
  } : {};

  const sendToFilters = sendTo.filters && Array.isArray(sendTo.filters) ? {
    filters: sendTo.filters
  } : {};

  const sendToIncludePlayerIds = sendTo.includePlayerIds && Array.isArray(sendTo.includePlayerIds) ? {
    include_player_ids: sendTo.includePlayerIds || []
  } : {};

  const sendToIncludedSegments = sendTo.includedSegments && Array.isArray(sendTo.includedSegments) ? {
    included_segments: sendTo.includedSegments || []
  } : {};

  const sendToExcludedSegments = sendTo.excludedSegments && Array.isArray(sendTo.excludedSegments) ? {
    included_segments: sendTo.excludedSegments || []
  } : {};

  const firstNotification = new OneSignal.Notification({
    ...body,
    ...contentsObj,
    ...dataObj,
    ...headingsObj,
    ...sendAfterObj,
    ...sendToFilters,
    ...sendToIncludePlayerIds,
    ...sendToIncludedSegments,
    ...sendToExcludedSegments
  });

  return new Promise((resolve, reject) => {
    try {
      oneSignalClient.sendNotification(firstNotification, (err, httpResponse, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    } catch (ex) {
      return reject(ex);
    }
  });
};

export default Lib;