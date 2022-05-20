import Promise from 'bluebird';

const uuid = require('node-uuid');
const _ = require('lodash');
const mkdirp = require('mkdirp');

let ip = require('ip');

export default {

  promisify(fn, context) {
    if (context) {
      return Promise.promisify(fn, {
        context,
      });
    }
    return Promise.promisify(fn);
  },

  async mkdirp(...args) {
    const mkdirpAsync = this.promisify(mkdirp);
    return mkdirpAsync(...args);
  },

  async mkdirParent(dirPath, mode, callback) {
    try {
      callback(null, await this.mkdirp(dirPath, mode));
    } catch (e) {
      callback(e);
    }
  },
  isGeneratorFn(f) {
    return (typeof f === 'function' && Object.getPrototypeOf(f) !== Object.getPrototypeOf(Function));
  },
  isAsyncFn(f) {
    return f.toString().indexOf('function (') === 0 && f.toString().indexOf('{return _ref') !== -1;
  },
  capitaliseFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  },

  multisplice(array, args) {
    args.sort((a, b) => a - b);

    for (let i = 0; i < args.length; i += 1) {
      const index = args[i] - i;
      array.splice(index, 1);
    }
  },

  uuidV1(noSegments) {
    if (noSegments) {
      return uuid.v1().replace(/-/g, '');
    }
    return uuid.v1();
  },

  uuidV4(noSegments) {
    if (noSegments) {
      return uuid.v4().replace(/-/g, '');
    }
    return uuid.v4();
  },

  wrapResponse() {
    const response = {
      success(res, message, code, options) {
        if (res.headerSent) return;
        if (_.isObject(code)) {
          options = code;
          code = 200;
        }
        res.status(parseInt(code, 10) || 200).json({
          status: 'success',
          result: message,
          code: code || 200,
          options,
        });
      },
      error(res, message, code, options) {
        if (res.headerSent) return;
        res.status(parseInt(code, 10) || 400).json({
          status: 'error',
          result: message,
          code: code || 400,
          options,
        });
      },
      exception(res, exception, code, options) {
        const logicError = exception.name === 'AssertionError';
        options = _.isString(options) ? {
          defaultText: options,
        } : (options || {});

        const messageObject = _.isObject(exception.message) ? exception.message : {
          text: exception.message,
          status: code || 500,
        };

        let displayMessage = '';
        if (!logicError) {
          displayMessage = options.defaultText || 'Sorry, there was an internal server error';
        }

        //   if (Root.app.settings.env === 'production' || Root.app.settings.env === 'stagging') {
        //     const errorNotify = Root.require('root/class/lib/errors/error-notify.js');
        //     const errorId = errorNotify.slack(exception, res._req, {
        //       criticalLevel: 1,
        //       module: 'ANY',
        //     });
        //     errorNotify.email(errorId, exception, res._req, {
        //       criticalLevel: 1,
        //       module: 'ANY',
        //     }).then(() => {});
        //   }
        // } else {
        //   displayMessage = messageObject.text || exception.message || options.defaultText || 'Sorry, there was an internal server error';
        // }

        // const stack = Root.Config('app').debug ? {
        //   err: messageObject.text || exception.message,
        //   stack: exception.stack || exception,
        //   options,
        // } : null;
        // if (Root.Config('app').debug && Root.app.settings.env !== 'testing') {
        //   root.core.log(stack);
        // }
        if (res.headerSent) return;

        code = parseInt(messageObject.status, 10) || parseInt(code, 10) || 500;
        try {
          res.status(code).json({
            status: 'error',
            result: displayMessage,
            code,
            options,
          });
        } catch (e) {
          root.core.error(e);
        }
      },
    };
    return response;
  },

  getServerUrl() {
    if (process.env.DOMAIN) {
      ip = process.env.DOMAIN;
    } else {
      ip = ip.address();
    }
    return `${process.env.SCHEME ? process.env.SCHEME : 'http'}://${ip}:${process.env.PORT || 80}/`;
  },

  assert(falsy, message, options) {
    if (!falsy) {
      const expData = options || {};
      expData.message = message;
      throw new Error(expData);
    }
  },

  sortObject(obj) {
    const arr = [];
    obj.forEach((prop) => {
      if (obj[prop]) {
        arr.push({
          key: prop,
          value: obj[prop],
        });
      }
    });
    arr.sort((a, b) => b.value - a.value);
    return arr; // returns array
  },

  countMessage(message, options) {
    options = options || {};

    let cutStrLength = 0;

    options = _.extend({

      cut: true,
      maxSmsNum: 3,
      interval: 400,

      counters: {
        message: 0,
        character: 0,
      },

      lengths: {
        ascii: [160, 306, 459],
        unicode: [70, 134, 201],
      },
    }, options);

    let smsType;
    let smsLength = 0;
    let smsCount = -1;
    let charsLeft = 0;
    let text = message;
    let isUnicode = false;

    for (let charPos = 0; charPos < text.length; charPos += 1) {
      switch (text[charPos]) {
        case '\n':
        case '[':
        case ']':
        case '\\':
        case '^':
        case '{':
        case '}':
        case '|':
        case '€':
          smsLength += 2;
          break;

        default:
          smsLength += 1;
      }

      //! isUnicode && text.charCodeAt(charPos) > 127 && text[charPos] != "€" && (isUnicode = true)
      if (text.charCodeAt(charPos) > 127 && text[charPos] !== '€') { isUnicode = true; }
    }

    if (isUnicode) smsType = options.lengths.unicode;
    else smsType = options.lengths.ascii;

    for (let sCount = 0; sCount < options.maxSmsNum; sCount += 1) {
      cutStrLength = smsType[sCount];
      if (smsLength <= smsType[sCount]) {
        smsCount = sCount + 1;
        charsLeft = smsType[sCount] - smsLength;
        break;
      }
    }

    if (options.cut) {
      text = text.substring(0, cutStrLength);
    }

    smsCount = smsCount === -1 ? (smsCount = options.maxSmsNum, charsLeft = 0) : smsCount;

    return {
      sms: smsCount,
      chars_left: charsLeft,
    };
  },

  mapTemplate(message, parameters) {
    _.each(parameters, (key) => {
      const val = parameters[key];
      const reg = new RegExp(`{${key}}`, 'gi');
      message = message.replace(reg, val);
    });
    return message;
  },

  sort4Aggregate(sorts) {
    let sort = _.map(sorts.replace(/,/g, ' ').split(' '), (value) => {
      const tmp = {};
      if (value.startsWith('-')) {
        const keyTmp = value.replace('-', '');
        tmp[keyTmp] = -1;
      } else {
        tmp[value] = 1;
      }
      return tmp;
    });

    const keys = _.map(sort, value => _.keys(value)[0]);
    const values = _.map(sort, value => _.values(value)[0]);
    sort = _.object(keys, values);

    return sort;
  },

  checkRole(roles, type) {
    const result = _.filter(roles, role => role.name === type);
    return result.length > 0;
  },

  convertArrayToUniqueString(arr) {
    // sort array
    arr = arr.sort();
    let result = '';
    arr.forEach((key) => {
      const obj = arr[key];
      result += `${obj}-`;
    });
    result = result.substr(0, result.length - 1);
    return result;
  },

  ignoreMine(list, ignore) {
    const result = _.filter(list, v => v !== `${ignore}`);
    return result;
  },
  propToString(obj) {
    return _.each(obj, (v, k) => {
      let item = v;
      if (_.isNumber(v) || _.isBoolean(v)) {
        item = v.toString();
        obj[k] = item;
      } else if (!v) {
        item = '';
        obj[k] = item;
      }
      return item;
    });
  }
};
