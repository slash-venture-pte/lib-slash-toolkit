import AWS from 'aws-sdk';
import FileType from 'file-type';

import config from '../configs';

// const assert = require('assert');
let configOptions;
const Lib = {};
// const s3Stream = require('s3-upload-stream')(new AWS.S3());

/**
 * Initialize
 * @param {*} opts Options configuration ex: {
 * profileName: 'bunnaro',
 * apiKey: '...',
 * security: '...',
 * bucketName: '...' }
 */
Lib.init = (opts) => {
  configOptions = config.get('aws');

  if (opts) {
    configOptions = Object.assign(configOptions, opts);
  }

  AWS.config.credentials = new AWS.SharedIniFileCredentials({
    profile: configOptions.profileName || 'default'
  });
  AWS.config.update({
    accessKeyId: configOptions.apiKey || configOptions.accessKeyId,
    secretAccessKey: configOptions.security || configOptions.secretAccessKey
  });
};

Lib.upload = async (fileName, buffer, fileMimeType) => {
  if (!configOptions) {
    Lib.init();
  }

  const {
    mime
  } = FileType(buffer);

  return new Promise((resolve, reject) => {
    try {
      // const data = fs.readFileSync(filePath);
      // const base64Data = Buffer.from(data, 'binary');
      const params = {
        Bucket: configOptions.bucketName,
        Key: fileName,
        ContentType: fileMimeType || mime || undefined,
      };

      if (configOptions.acl) {
        if (configOptions.acl !== 'none') {
          params.ACL = configOptions.acl;
        }
      } else {
        params.ACL = 'public-read';
      }

      const s3obj = new AWS.S3({
        params,
      });

      s3obj.upload({
        Body: buffer
      }).on('httpUploadProgress', () => {}).send((err, dataRes) => {
        if (err) {
          return reject(err);
        }
        resolve(dataRes);
      });
    } catch (ex) {
      return reject(ex);
    }
  });
};

Lib.getFileUrl = (fileName, subDomain) => {
  if (!configOptions) {
    Lib.init();
  }
  return `https://${configOptions.bucketName}.${subDomain || 's3-ap-southeast-1'}.amazonaws.com/${fileName}`;
};

Lib.deleteObject = (fileName) => {
  if (!configOptions) {
    Lib.init();
  }
  return new Promise((resolve, reject) => {
    try {
      const s3obj = new AWS.S3({
        params: {
          Bucket: configOptions.bucketName,
          Key: fileName,
        }
      });
      s3obj.deleteObject((err, data) => {
        if (err) reject(err);
        resolve(data);
      });
    } catch (ex) {
      return reject(ex);
    }
  });
};

Lib.deleteObjects = (fileNames) => {
  if (!configOptions) {
    Lib.init();
  }
  function translateKey(files) {
    const result = [];
    for (let i = 0; i < files.length; i += 1) {
      result.push({
        Key: files[i],
      });
    }
    return result;
  }
  return new Promise((resolve, reject) => {
    try {
      const s3obj = new AWS.S3({
        params: {
          Bucket: configOptions.bucketName,
          Delete: {
            Objects: translateKey(fileNames),
            Quiet: false
          },
        },
      });
      s3obj.deleteObjects((err, data) => {
        if (err) reject(err);
        resolve(data);
      });
    } catch (ex) {
      return reject(ex);
    }
  });
};

export default Lib;