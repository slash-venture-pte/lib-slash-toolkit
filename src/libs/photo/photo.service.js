import AWS from 'aws-sdk';
import * as fs from 'fs';
import * as https from 'https';
import config from '../../configs';

import helper from '../../utils';
import Base from '../base';

let s3Stream = null;

const gm = require('gm');

export default class PhotoService extends Base {
  static init(configData) {
    this.config = configData;
    this.config = config.get('photo');
    if (configData) {
      this.config = Object.assign(this.config, configData);
    }
    // Assign the configure for aws
    const awsConfigOptions = config.get('aws');
    AWS.config.credentials = new AWS.SharedIniFileCredentials({
      profile: awsConfigOptions.profileName || 'default'
    });
    AWS.config.update({
      accessKeyId: awsConfigOptions.apiKey || awsConfigOptions.accessKeyId,
      secretAccessKey: awsConfigOptions.security || awsConfigOptions.secretAccessKey
    });
    // Init s3 stream after aws config
    s3Stream = require('s3-upload-stream')(new AWS.S3()); // eslint-disable-line
  }
  static async crop(filePath, options) {
    try {
      options = options || {
        width: 250,
        height: 250,
        output: ''
      };
      const width = options.width * 1;
      const height = options.height * 1;
      // const output = options.output;
      // const linkPath = options.linkPath;
      // const cropX = options.cropX || 0;
      // const cropY = options.cropY || 0;

      const {
        outputDir,
        linkPath,
        output
      } = options;
      await helper.mkdirp(outputDir, '0777');
      return new Promise((resolve, reject) => {
        gm(filePath)
          .options({
            imageMagick: false
          })
          .size((err, value) => {
            if (err) reject(err);

            const widthNGreater = width >= height;
            // const ratio = width / height;
            // let ratioOrig = value.width > value.height

            const widthGreater = value.width > value.height;
            let widthA;
            let heightA;
            let newCropX;
            let newCropY;

            if (!widthNGreater) {
              if (!widthGreater) {
                widthA = value.width;
                heightA = (widthA * height) / width;
                newCropX = 0;
                newCropY = (value.height - heightA) / 2;
              } else {
                widthA = (value.height * width) / height;
                heightA = value.height;
                newCropX = (value.width - widthA) / 2;
                newCropY = 0;
              }
            } else {
              widthA = (value.height * width) / height;
              heightA = value.height;
              newCropX = (value.width - widthA) / 2;
              newCropY = 0;
            }
            if (this.config.gcloudConfig.cloudType === 'aws') {
              gm(filePath)
                .options({
                  imageMagick: false
                })
                .compress('JPEG')
                .autoOrient()
                .crop(widthA, heightA, newCropX, newCropY)
                .resize(width, height)
                // .crop(targetWidth, targetHeight, newCropX, newCropY)
                .stream((errAWS, stdout) => {
                  if (errAWS) {
                    reject(errAWS);
                  }
                  // let compress = zlib.createGzip();
                  let params = {
                    Bucket: this.config.gcloudConfig.storage['bucket-name'],
                    Key: linkPath,
                    ContentType: `image/${options.extension || 'jpeg'}`,
                  };
      
                  if(this.config.gcloudConfig.storage['acl']){
                    if( this.config.gcloudConfig.storage['acl'] != 'none'){
                      params.ACL = this.config.gcloudConfig.storage['acl'] || 'public-read';
                    }
                  }
                  const upload = s3Stream.upload(params);
                  upload.on('uploaded', detail => resolve(detail));
                  stdout.pipe(upload)
                    .on('error', errSt => reject(errSt))
                    .on('end', () => resolve(output));
                });
            } else if (this.config.gcloudConfig.cloudType === 'gcloud') {
              /* const blob = bucket.file(linkPath);
              gm(filePath)
                .options({
                  imageMagick: false
                })
                .compress('JPEG')
                .autoOrient()
                .crop(widthA, heightA, newCropX, newCropY)
                .resize(width, height)
                // .crop(cropWidth * 1, cropHeight * 1, newCropX, newCropY)
                // .crop(targetWidth, targetHeight, newCropX, newCropY)
                .resize(width, height)
                .stream((err, stdout) => {
                  stdout.pipe(blob.createWriteStream())
                    .on('error', (errStStream) => {
                      fs.exists(filePath, (v) => {
                        if (v) fs.unlinkSync(filePath);
                      });
                      return reject(errStStream);
                    })
                    .on('end', () => {
                      resolve(output);
                    });
                }); */
            } else {
              gm(filePath)
                .options({
                  imageMagick: false
                })
                .compress('JPEG')
                .autoOrient()
                .crop(widthA, heightA, newCropX, newCropY)
                .resize(width, height)
                // .crop(cropWidth * 1, cropHeight * 1, newCropX, newCropY)
                // .crop(targetWidth, targetHeight, newCropX, newCropY)
                // .resize(width, height)
                .write(output, (errElse) => {
                  if (errElse) {
                    fs.exists(filePath, (v) => {
                      if (v) fs.unlinkSync(filePath);
                    });
                    return reject(errElse);
                  }
                  return resolve(output);
                });
            }
          });
      });
    } catch (e) {
      return e;
    }
  }

  static async resize(filePath, options) {
    try {
      options = options || {
        width: 250,
        height: 250,
        output: ''
      };
      // const width = options.width;
      const height = options.height === 'auto' ? null : options.height;
      // const output = options.output;
      // const linkPath = options.linkPath;
      // const outputDir = options.outputDir;

      const {
        width,
        output,
        linkPath,
        outputDir
      } = options;

      await helper.mkdirp(outputDir, '0777');
      return new Promise((resolve, reject) => {
        gm(filePath)
          .options({
            imageMagick: false
          })
          .size((err, value) => {
            if (err) {
              return reject(err);
            }
            // Do not resize keep the same
            if (value.width <= width) {
              if (this.config.gcloudConfig.cloudType === 'aws') {
                console.log('Resizing - aws when value.width <= width', width, height, filePath);
                gm(filePath)
                  .options({
                    imageMagick: false
                  })
                  // .compress('JPEG')
                  // .quality(options.quality || 100)
                  .autoOrient()
                  .stream((err1, stdout) => {
                    if (err1) {
                      return reject(err);
                    }
                    // var compress = zlib.createGzip();
                    // let buffer = new Buffer(stdout);
                    let params = {
                      Bucket: this.config.gcloudConfig.storage['bucket-name'],
                      Key: linkPath,
                      ContentType: `image/${options.extension || 'jpeg'}`,
                    };
        
                    if(this.config.gcloudConfig.storage['acl']){
                      if( this.config.gcloudConfig.storage['acl'] != 'none'){
                        params.ACL = this.config.gcloudConfig.storage['acl'] || 'public-read';
                      }
                    }
                    
                    const upload = s3Stream.upload(params);
                    // Logger.debug('photoLog', 'photoLib::mimetype::log...', 'image/' + (options.extension || 'jpeg'));
                    upload.on('uploaded', detail => resolve(detail));
                    stdout.pipe(upload)
                      .on('error', (err2) => {
                        // Logger.error('photoLib::resize::upload\t\t' + err);
                        return reject(err2);
                      })
                      .on('end', () => {
                        return resolve(output);
                      });
                  });
              } else if (this.config.gcloudConfig.cloudType === 'gcloud') {
                /* const blob = bucket.file(linkPath);
                gm(filePath)
                  .options({
                    imageMagick: false
                  })
                  // .quality(options.quality || 100)
                  .autoOrient()
                  // .compress('JPEG')
                  .stream(function (err, stdout, stderr) {
                    stdout.pipe(blob.createWriteStream(opts))
                      .on('error', function (err) {
                        fs.exists(filePath, function (v) {
                          if (v)
                            fs.unlink(filePath);
                        });
                        return callback(err, null);
                      })
                      .on('end', function () {
                        callback(null, output);
                      });
                  }); */
              } else {
                gm(filePath)
                  .options({
                    imageMagick: false
                  })
                  // .compress('JPEG')
                  // .quality(options.quality || 100)
                  .autoOrient()
                  .write(output, (err3) => {
                    if (err3) {
                      fs.exists(filePath, (v) => {
                        if (v) fs.unlinkSync(filePath);
                      });
                      return reject(err);
                    }
                    return resolve(output);
                  });
              }
            } else if (this.config.gcloudConfig.cloudType === 'aws') {
              // console.log('Resizing - aws resize to smaller', width, height);
              gm(filePath)
                .options({
                  imageMagick: false
                })
                // .compress('JPEG')
                // .quality(options.quality || 100)
                .autoOrient()
                .resize(width, height)
                .autoOrient()
                .stream((err4, stdout) => {
                  if (err4) {
                    // Logger.error('photoLib::resize::stream\t\t' + err);
                    return reject(err);
                  }
                  // var compress = zlib.createGzip();
                  // let buffer = new Buffer(stdout);
                  let params = {
                    Bucket: this.config.gcloudConfig.storage['bucket-name'],
                    Key: linkPath,
                    ContentType: `image/${options.extension || 'jpeg'}`,
                  };
      
                  if(this.config.gcloudConfig.storage['acl']){
                    if( this.config.gcloudConfig.storage['acl'] != 'none'){
                      params.ACL = this.config.gcloudConfig.storage['acl'] || 'public-read';
                    }
                  }
                  const upload = s3Stream.upload(params);
                  // Logger.debug('photoLog', 'photoLib::mimetype::log...', 'image/' + (options.extension || 'jpeg'));
                  upload.on('uploaded', (detail) => {
                    return resolve(detail);
                  });
                  stdout.pipe(upload)
                    .on('error', (err5) => {
                      // Logger.error('photoLib::resize::upload\t\t' + err);
                      return reject(err5);
                    })
                    .on('end', () => {
                      return resolve(output);
                    });
                  return null;
                });
            } else if (this.config.gcloudConfig.cloudType === 'gcloud') {
              /* const blob = bucket.file(linkPath);
              gm(filePath)
                .options({
                  imageMagick: false
                })
                // .compress('JPEG')
                // .quality(options.quality || 100)
                .autoOrient()
                .resize(width, height)
                .autoOrient()
                .stream(function (err, stdout, stderr) {
                  stdout.pipe(blob.createWriteStream(opts))
                    .on('error', function (err) {
                      fs.exists(filePath, function (v) {
                        if (v)
                          fs.unlink(filePath);
                      });
                      return callback(err, null);
                    })
                    .on('end', function () {
                      callback(null, output);
                    });
                }); */
            } else {
              gm(filePath)
                .options({
                  imageMagick: false
                })
                // .compress('JPEG')
                // .quality(options.quality || 100)
                .autoOrient()
                .resize(width, height)
                .autoOrient()
                .write(output, (err1) => {
                  if (err1) {
                    fs.exists(filePath, (v) => {
                      if (v) fs.unlinkSync(filePath);
                    });
                    return reject(err1);
                  }
                  return resolve(output);
                });
            }
          });
      });
    } catch (e) {
      return e;
    }
  }

  static async upload(linkPath, file) {
    return new Promise((resolve, reject) => {
      try {
        gm(file.path)
          .options({
            imageMagick: false
          })
          // .compress('Zip')
          .autoOrient()
          .stream((err, stdout) => {
            if (err) {
              return reject(err);
            }

            let params = {
              Bucket: this.config.gcloudConfig.storage['bucket-name'],
              Key: linkPath,
              ContentType: (file.mimetype || 'image/jpeg'),
            };

            if(this.config.gcloudConfig.storage['acl']){
              if( this.config.gcloudConfig.storage['acl'] != 'none'){
                params.ACL = this.config.gcloudConfig.storage['acl'] || 'public-read';
              }
            }

            // params.Body = data;
            // if (!file.mimetype) {
            //   Logger.error('photoLib::mimetype::error not correct...');
            // } else {
            //   Logger.debug('photoLog', 'photoLib::mimetype::log...', file.mimetype);
            // }

            const upload = s3Stream.upload(params);
            upload.on('uploaded', (detail) => {
              resolve(detail);
            });
            stdout.pipe(upload)
              .on('error', err1 => reject(err1))
              .on('end', () => {
                // resolve(output);
              });
          });
      } catch (e) {
        reject(e);
      }
    });
  }

  static async uploadDirect(linkPath, file) {
    return new Promise((resolve, reject) => {
      try {
        let params = {
          Bucket: this.config.gcloudConfig.storage['bucket-name'],
          Key: linkPath,
          ContentType: (file.mimetype || 'image/jpeg'),
        };

        if(this.config.gcloudConfig.storage['acl']){
          if( this.config.gcloudConfig.storage['acl'] != 'none'){
            params.ACL = this.config.gcloudConfig.storage['acl'] || 'public-read';
          }
        }
        // params.Body = data;
        // console.log(file.mimetype);
        /* if (!file.mimetype) {
          Logger.error('photoLib::mimetype::error not correct...');
        } else {
          Logger.debug('photoLog', 'photoLib::mimetype::log...', file.mimetype);
        } */

        const read = fs.createReadStream(file.path);
        const upload = s3Stream.upload(params);
        upload.on('uploaded', (detail) => {
          resolve(detail);
        });
        read.pipe(upload)
          .on('error', (err) => {
            return reject(err);
          })
          .on('end', () => {
            // resolve(output);
          });
      } catch (e) {
        reject(e);
      }
    });
  }

  static async toBuffer(linkPath, path, extension, buffer) {
    return new Promise((resolve, reject) => {
      if (this.config.gcloudConfig.cloudType === 'aws') {
        const s3obj = new AWS.S3({
          params: {
            Bucket: 'shoppymesh',
            Key: linkPath,
            ContentType: `image/${extension}`,
            ACL: 'public-read'
          }
        });
        s3obj.upload({
          Body: buffer
        }).on('httpUploadProgress', () => {}).send((err) => {
          if (err) {
            return reject(err);
          }
          resolve(path);
        });
      } else if (this.config.gcloudConfig.cloudType === 'gcloud') {

        /* const blob = bucket.file(linkPath);
        const wStream = blob.createWriteStream(opts);
        wStream.write(buffer);
        wStream.end((err) => {
          if (err) {
            return reject(err);
          }
          resolve(path);
        }); */
      } else {
        const file = fs.createWriteStream(path);
        file.write(buffer);
        file.end((err) => {
          if (err) {
            return reject(err);
          }
          resolve(path);
        });
      }
    });
  }

  static cleanup(paths, i) {
    if (i >= paths.length) {
      return;
    }
    // Remove the tmp file and the wrong generated photo
    if (fs.existsSync(paths[i])) {
      fs.unlinkSync(paths[i]);
      this.cleanup(paths, i + 1);
    }
  }

  static async download(url, dest) {
    return new Promise((resolve, reject) => {
      try {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
          response.pipe(file);
          file.on('finish', () => {
            file.close(() => {
              resolve(true);
            });
          });
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}