import assert from 'assert';
import moment from 'moment';
import pluralize from 'pluralize';
import _ from 'underscore';
// import request from 'request';
import oneSignal from './plugins/notification/one-signal';
import stringLib from './strings';
import cacheLib from '../libs/cache';
import helper from '../utils';
// const stringLib = Root.require('root/class/lib/strings.js');

// const assert= require('assert');
// const _ = Root._;

// Using oneSignal
const push = oneSignal;
let User;
let Notification;
let memStore;
let DevicePush;

exports.init = (optsMemstore, optsNotification, optsString) => {
  memStore = cacheLib.createMemstore(optsMemstore);
  User = optsNotification.User; // eslint-disable-line prefer-destructuring
  Notification = optsNotification.Notification; // eslint-disable-line prefer-destructuring
  DevicePush = optsNotification.DevicePush; // eslint-disable-line prefer-destructuring
  stringLib.init(optsString);
};

/**
 * transform payload send to socket client
 * @param {*} notification
 * @param {*} options Notification option
 */
const transformPayload = async (notification) => {
  let result = notification;
  const createdByUser = await User.fetch().deepPopulate(['profile', 'profile.avatar']).where('_id').equals(notification._created_by)
    .exec();
  assert(createdByUser, 'Could not find the notification creator');

  if (result.reference_id) {
    const modelName = stringLib.capitalize(pluralize.singular(result.reference_type));
    const model = global[modelName === 'Moduletemplate' ? 'ModuleTemplate' : modelName];
    result = JSON.parse(JSON.stringify(result));
    result.reference_id = await model.fetch()
      .where('_id').equals(result.reference_id)
      .exec();
    if (result.reference_id.reference_id) {
      result = JSON.parse(JSON.stringify(result));
      const modelNameInner = stringLib.capitalize(pluralize.singular(result.reference_id.reference_type));
      const modelInner = global[modelNameInner === 'Moduletemplate' ? 'ModuleTemplate' : modelNameInner];

      const resultInner = await modelInner.fetch()
        .where('_id').equals(result.reference_id.reference_id)
        .populate('media')
        .exec();
      result.reference_id.reference_id = resultInner;
    }
    // root.core.info('transformPayload prefix');
  }
  // console.log(' *** transformPayload', JSON.stringify(result));
  return {
    action: result.action,
    data: {
      payloads: _.pick(result, 'created_at', 'reference_type', 'reference_id'),
      created_by_user: createdByUser,
      created_at: moment().utc().format('YYYY-MM-DD HH:mm:ss'),
    },
  };
};

const sendSocket = async (notification, userId, data) => {
  // Send to one self
  const defaultPubSubNsp = data.options.namespace || root.core.config.socket.pubSub.defaultNamespace;
  const prefix = defaultPubSubNsp ? `PRE:${defaultPubSubNsp}:` : '';
  // root.core.info(`Namespacing prefix ${prefix}`);

  const payload = await transformPayload(notification, data.options);

  // console.log('sendSocket payload', payload);

  let ref = null;
  if (helper.isGeneratorFn(data.refFn)) {
    ref = await data.refFn(notification);
  } else if (_.isFunction(data.refFn)) {
    ref = data.refFn(notification);
  }
  payload.ref = ref;
  // Find user hash
  const user = await User.fetch().where('_id').equals(userId).exec();
  if (user) {
    // console.log('-------- publish', `${prefix}MSG:${user._id}`);
    memStore.context.publish(`${prefix}MSG:${user._id}`, JSON.stringify(payload));
    // if (data.options.uuid) {
    //   memStore.context.publish(`${prefix}MSG:${user._id}:${data.options.uuid}`, JSON.stringify(payload));
    // } else {
    //   memStore.context.publish(`${prefix}MSG:${user._id}`, JSON.stringify(payload));
    // }
  }
  return notification;
};

const sendPush = async (notification, userId, data) => {
  // Send to one self
  // const payload = await transformPayload(notification, data.options);

  // TODO: Session based push notification
  const query = DevicePush.fetchAll().where('user').equals(userId);
  // root.core.log(userId, data.options.uuid);
  // if (data.options.uuid) {
  //   query = query.where('uuid').equals(data.options.uuid);
  // }
  const devices = await query.exec();
  // root.core.log('Send to devices: ', devices.length, userId);
  // data.options.parse = data.options.parse || {};
  // eslint-disable-next-line no-restricted-syntax,guard-for-in
  devices.forEach(async (key) => {
    const device = devices[key];
    const body = {
      include_player_ids: [device.push_token],
      // included_segments: ['All'],
      ios_badgeType: data.options.push.ios_badgeType, // [None, SetTo, Increase]
      ios_badgeCount: data.options.push.ios_badgeCount,
      contents: {
        en: data.options.push.message,
      },
      headings: {
        en: data.options.push.title,
      },
      data: data.options.push,
    };

    // check active device
    let isSendPush = true;
    // if user+session in the room
    if (data.action === 'direct-message' || data.action === 'project-message') {
      const keyRoom = `USER:ENTERED:ROOM:${userId}-${device.uuid}`;
      const channelId = await cacheLib.fetch(keyRoom); // channel
      if (data.others.reference_type === 'chats' && channelId) {
        if (`${data.options.push.custom_data.channel_id}` === `${channelId}`) {
          isSendPush = false;
        }
      }
    }
    if (isSendPush) {
      push(body);
    }

    root.core.debug(`Push notification - ${userId}`);
  });
};

const sendPushAll = async (data) => {
  const body = {
    // include_player_ids: [device.push_token],
    included_segments: ['All'],
    ios_badgeType: data.options.push.ios_badgeType, // [None, SetTo, Increase]
    ios_badgeCount: data.options.push.ios_badgeCount,
    contents: {
      en: data.options.push.message,
    },
    headings: {
      en: data.options.push.title,
    },
    data: data.options.push,
  };
  push(body);
  root.core.debug('Push notification - all');
};

const thenByUser = async (userId, data) => {
  let notification = null;
  const notificationData = {
    user: userId,
    text: data.message,
    action: data.action,
    _created_by: data.others.created_by || userId,
    is_seen: false,
    is_read: false,
    // small_url_link: data.others.small_url_link,
    // thumbnail_url_link:data.others.thumbnail_url_link,
    // preview_url_link:data.others.preview_url_link,
    // trip_type: data.others.trip_type,
    project: data.others.project,
    reference_id: data.others.reference_id,
    reference_type: data.others.reference_type,
    title: data.others.title,
    subtitle: data.others.subtitle,
    description: data.others.description,
  };

  // if (data.others.use_existing || data.void) {
  //   notification = await Notification.fetch({
  //     user: userId,
  //     action: data.action,
  //     reference_id: data.others.reference_id,
  //     reference_type: data.others.reference_type,
  //   }).exec();

  //   if (notification) {
  //     if (!data.void) {
  //       notification = Root._.extend(notification, notificationData);
  //       notification = await notification.save();
  //     } else {
  //       notification.deleted = true;
  //       notification = await notification.save();
  //     }
  //     notification = notification[0];
  //   }
  // }

  // if (data.void) {
  //   return;
  // }
  if (!data.alertOnly) {
    if (!notification) {
      notification = await new Notification(notificationData).save();
    }
    assert(notification, 'notification.then: Notification data is not getting saved.');
  } else {
    // doen't store in db
    notification = notificationData;
    notification._created_by = await User.fetch().deepPopulate(['profile']).where('_id').equals(notification._created_by)
      .exec();
  }

  if (data.mode === 'broadcast' || data.mode === 'broadcast-favorite') {
    root.core.debug('Broadcast or Broadcast favorite');
  } else if (data.mode === 'own') {
    await sendSocket(notification, userId, data);
  } else if (data.mode === 'push-notification') {
    if (data.alertAll) {
      await sendPushAll(data);
    } else {
      await sendPush(notification, userId, data);
    }
  } else if (data.mode === 'auto') {
    // send socket
    await sendSocket(notification, userId, data);
    // send push
    if (data.alertAll) {
      await sendPushAll(data);
    } else {
      await sendPush(notification, userId, data);
    }
  }
};

// #4 then
const thenAction = async (data) => {
  if (_.isArray(data.user_id)) {
    for (let i = 0; i < data.user_id.length; i += 1) {
      if (data.user_id[i]) {
        await thenByUser(data.user_id[i], data); // eslint-disable-line no-await-in-loop
      }
    }
  } else {
    await thenByUser(data.user_id, data);
  }
};

// #3 alert
const alertAction = (mode, refFn, data) => {
  assert(['broadcast', 'broadcast-favorite', 'own', null].indexOf(mode), 'Invalid alert action');
  data.mode = mode;
  data.refFn = refFn;
  return {
    then: async (dataTmp) => {
      const result = await thenAction(dataTmp);
      return result;
    },
  };
};

// #2 save
const saveAction = (others, data) => {
  data.others = others;
  if (!data.void) {
    return {
      alert: alertAction,
    };
  }
  return {
    then: async (dataTmp) => {
      const result = await thenAction(dataTmp);
      return result;
    },
  };
};

// #1 on
const onAction = (action, data) => {
  data.action = action;
  return {
    save: async (dataTmp) => {
      const result = await saveAction(dataTmp);
      return result;
    },
  };
};
/**
 * Create notification
 */
exports.notify = (user, options) => {
  const data = {};
  data.options = _.isObject(options) ? options : {};
  if (_.isArray(user)) {
    data.user_id = user;
  } else {
    data.user_id = _.isObject(user) ? user._id : user;
  }
  data.alertOnly = data.options.alertOnly || false;
  data.alertAll = data.options.alertAll || false;
  assert(_.isArray(data.user_id) || _.isNumber(data.user_id * 1), `notification.notify: Invalid user id. Data: ${data.user_id}`);
  return {
    on: async (dataTmp) => {
      const result = await onAction(dataTmp);
      return result;
    },
  };
};

/**
 * Void notification
 */
exports.void = (user, options) => {
  const data = {};
  data.options = _.isObject(options) ? options : {};
  if (_.isArray(user)) {
    data.user_id = user;
  } else {
    data.user_id = _.isObject(user) ? user._id : user;
  }
  data.void = true;
  assert(_.isArray(data.user_id) || _.isNumber(data.user_id * 1), `notification.notify: Invalid user id. Data: ${data.user_id}`);
  return {
    on: async (dataTmp) => {
      const result = await onAction(dataTmp);
      return result;
    },
  };
};
