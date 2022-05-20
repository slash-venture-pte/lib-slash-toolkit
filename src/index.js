// Load configuration
import config from './configs/index';
import util from './utils';
import log from './utils/log';
import time from './utils/time';

import cache from './libs/cache';
import email from './libs/email';
import errorNotify from './libs/error-notify';
import photo from './libs/photo/photo';
import aws from './libs/aws';
import onesignal from './libs/onesignal';
import firebase from './libs/firebase';

import plivo from './libs/plivo';

// Load configration from file
config.load();

exports.util = util;
exports.log = log;
exports.time = time;

exports.email = email;
exports.errorNotify = errorNotify;
exports.cache = cache;
exports.sms = {
  plivo,
};

exports.config = config;
exports.photo = photo;
exports.aws = aws;
exports.onesignal = onesignal;
exports.firebase = firebase;

