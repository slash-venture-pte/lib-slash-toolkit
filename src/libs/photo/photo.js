import * as fs from 'fs';
import { format } from 'util';

import Base from '../base';
import config from '../../configs';
import photoService from './photo.service';

const gm = require('gm');

export default class PhotoLib extends Base {
  static init(configData) {
    this.config = configData;
    this.config = config.get('photo');
    if (configData) {
      this.config = Object.assign(this.config, configData);
    }
    photoService.init(this.config);
  }

  static async identify(file) {
    return new Promise((resolve, reject) => {
      gm(file.path)
        .options({
          imageMagick: false
        })
        .identify((errIdentify, value) => {
          if (errIdentify) reject(errIdentify);
          else resolve(value);
        });
    });
  }

  static stat(file) {
    return fs.statSync(file.path);
  }

  /* static async removePhoto(photoKeys) {
    assert(Root._.isArray(photoKeys), 'Photo is not valid');
    photoKeys = Root._.filter(photoKeys, function (v) {
      return !!v;
    });
    let keys = Root._.map(photoKeys, function (v) {
      return {
        Key: v
      };
    });
    let method = helper.thunkify(s3bucket.deleteObjects, s3bucket);
    let result = await method({
      // Bucket: 'myprivatebucket/some/subfolders',
      Delete: {
        Objects: keys
      }
    });
    return result;
  } */

  static async crop(filePath, options) {
    return photoService.crop(filePath, options);
  }

  static async resize(filePath, options) {
    return photoService.resize(filePath, options);
  }

  static async upload(linkPath, file) {
    return photoService.upload(linkPath, file);
  }

  static async uploadDirect(linkPath, file) {
    return photoService.uploadDirect(linkPath, file);
  }

  static cleanup(paths, i) {
    return photoService.cleanup(paths, i);
  }

  static async download(url, dest) {
    return photoService.download(url, dest);
  }

  static async toBuffer(linkPath, path, extension, buffer) {
    return photoService.toBuffer(linkPath, path, extension, buffer);
  }

  static getDirectory(refType, photoType, sizes, filename, referenceId) {
    const result = {
      fullDirPath: {},
      fullFilePath: {},
      linkPath: {}
    };
    sizes.forEach(v => {
      const path = format(this.config.imageConfig[refType][photoType].directory, referenceId || 'shares', v);
      result.fullDirPath[v] = this.config.path.public(path);
      result.fullFilePath[v] = result.fullDirPath[v] + filename;
      result.linkPath[v] = path + filename;
    });
    return result;
  }

  static async fileDimensionSize(filePath) {
    return new Promise((resolve, reject) => {
      try {
        const tmpPath = this.config.path.storage(`tmp-image${new Date().getTime()}${Math.random() * 1000}.jpg`);
        gm(filePath)
          .options({
            imageMagick: false
          })
          .autoOrient()
          .write(tmpPath, err => {
            if (err) {
              // Logger.error('photoLib::resize::size\t\t' + err);
              reject(err);
            }
            gm(tmpPath)
              .options({
                imageMagick: false
              })
              .autoOrient()
              .size((errSize, value) => {
                if (errSize) {
                  // Logger.error('photoLib::resize::size\t\t' + err);
                  reject(errSize);
                }
                resolve(value);
                fs.unlinkSync(tmpPath);
              });
            /* gm(tmpPath)
              .options({
                imageMagick: false
              })
              .autoOrient()
              .identify((errIdentify, value) => {
                console.log('Identify result:', errIdentify, value);
              }); */
          });
      } catch (e) {
        reject(e);
      }
    });
  }
}
