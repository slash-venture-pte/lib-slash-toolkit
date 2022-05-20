import * as admin from 'firebase-admin';

import config from '../configs';
import util from '../utils';

let configOptions;
const Lib = {};

/**
 * Initialize
 * @param {userAuthKey, appAuthKey, appId} opts
 */
Lib.init = (opts) => {
  configOptions = config.get('firebase');
  if (opts) {
    configOptions = Object.assign(configOptions, opts);
  }

  admin.auth(admin.initializeApp({
    credential: admin.credential.cert(configOptions)
  }));
};

/**
 *
 * @param {*} sendTo {
    androidPushToken: string[];
    otherPushToken: string[]
  }
 * @param {*} payload {
    data?: {};
    notification?: {
      tag?: string;
      body?: string;
      icon?: string;
      badge?: string;
      color?: string;
      sound?: string;
      title?: string;
      bodyLocKey?: string;
      bodyLocArgs?: string;
      clickAction?: string;
      titleLocKey?: string;
      titleLocArgs?: string;
    }
  }
 * @param {*} options {
    dryRun?: boolean;
    priority?: string;
    timeToLive?: number;
    collapseKey?: string;
    mutableContent?: boolean;
    contentAvailable?: boolean;
    restrictedPackageName?: string;
  }
 */
Lib.sendNotification = async (sendTo, payload, options) => {
  if (!configOptions) {
    Lib.init();
  }

  const dataPayload = {
  };

  if (sendTo.androidPushToken && sendTo.androidPushToken.length) {
    return admin.messaging().sendToDevice(sendTo.androidPushToken, payload, options);
  }
  // iOS or beside android
  dataPayload.notification = payload.notification || {
    body: (payload.data || {}).notificationMessage || (payload.data || {}).message || undefined,
    tag: payload.data && payload.data.tag ? payload.data.tag : ''
  };

  return admin.messaging().sendToDevice(sendTo.otherPushToken, dataPayload, options);
};

Lib.sentToTopic = async (topic, payload, options) => {
  if (!configOptions) {
    Lib.init();
  }

  payload = util.propToString(payload);
  await admin.messaging().sendToTopic(topic, payload, { ...options });
};

Lib.subscribeToTopic = async (pushToken, topic) => {
  if (!configOptions) {
    Lib.init();
  }

  await admin.messaging().subscribeToTopic(pushToken, topic);
};

Lib.unsubscribeFromTopic = async (pushToken, topic) => {
  if (!configOptions) {
    Lib.init();
  }

  await admin.messaging().unsubscribeFromTopic(pushToken, topic);
};

export default Lib;
