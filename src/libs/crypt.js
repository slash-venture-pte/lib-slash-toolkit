// Crypt.js
/*

  Handle host configuration checks and  and load configuration to
  one object.
    https://code.google.com/p/crypto-js/issues/detail?id=91
    https://code.google.com/p/crypto-js/#AES
    http://cryptojs.altervista.org/secretkey/doc/doc_aes_cryptojs-v3.html
    http://nodejs.org/api/crypto.html#crypto_crypto_createcipher_algorithm_password

*/
import appLog from '../utils/log';
import time from '../utils/time';
import helper from '../utils/index';

const NodeRSA = require('node-rsa');
const crypto = require('crypto');
const fs = require('fs');
const printf = require('util').format;
const q = require('q');
const CryptoJS = require('crypto-js');

/**
 * Generate key public and private using diff-hell
 * @param { string } path Key to generate directory path
 * @param { string } filename Key name
 */
exports.generateKey = (path, filename) => {
  time.start();
  const deferred = q.defer();
  const key = new NodeRSA({
    b: 2048,
  });

  key.generateKeyPair();
  const keyPath = path; // `${Root.BasePath}storages/keys/`;
  helper.mkdirParent(keyPath, 777);
  const publicKey = key.getPublicPEM();

  fs.writeFile(`${keyPath}${filename}.pub`, publicKey, () => {
    root.core.log(printf('Generate public key at `%s` in %s', `${keyPath}key.pub`, time.stop()));
    const privateKey = key.getPrivatePEM();
    fs.writeFile(`${keyPath}${filename}.pem`, privateKey, () => {
      root.core.log(printf('Generate private key at `%s` in %s', `${keyPath}key.pem`, time.stop()));
      deferred.resolve();
    });
  });
  return deferred.promise;
};

/**
 * Encrypt message using the generated public key
 * @param { string } message Message to encrypt
 * @param { string } keyPath Path to public key
 */
exports.encrypt = (message, keyPath) => {
  try {
    const publicKeyPath = keyPath; // `${Root.BasePath}storages/keys/key.pub`;
    const data = fs.readFileSync(publicKeyPath); // , function(err, data) {

    const key = new NodeRSA();
    key.loadFromPEM(data.toString());

    if (key.isPublic()) {
      const encrypted = key.encrypt(message || '', 'base64');
      return encrypted;
    }
    return false;
  } catch (e) {
    appLog.error(`Crypt::decrypted\t\tError: ${e}`);
  }
  return false;
};

/**
 * Decrypt message by the private key
 * @param { string } message Message to encrypt
 * @param { string } keyPath Path to private key
 */
exports.decrypt = (keyPath, message) => {
  try {
    const privateKeyPath = keyPath; // `${Root.BasePath}storages/keys/key.pem`;
    const data = fs.readFileSync(privateKeyPath);
    const key = new NodeRSA();
    key.loadFromPEM(data.toString());
    const decrypted = key.decrypt(message || '', 'base64');
    return Buffer.from(decrypted, 'base64').toString('utf8');
  } catch (e) {
    appLog.error(`Crypt::decrypted\t\tError: ${e}`);
  }
  return false;
};

/**
 * AES Decryption by key
 * @param {*} encryptdata Encypted data
 * @param {*} passkey Pass key
 */
exports.aesDecrypt = (encryptdata, passkey) => {
  const decrypted = CryptoJS.AES.decrypt(encryptdata, passkey);
  return decrypted.toString(CryptoJS.enc.Utf8);
};

/**
 * AES Encryption using pass key
 * @param {*} text Plain data
 * @param {*} passkey Pass key
 */
exports.aesEncrypt = (text, passkey) => {
  const encrypted = CryptoJS.AES.encrypt(text, passkey);
  return encrypted.toString();
};

/**
 * Sha256 password encryption
 * @param {*} message Plain data
 */
exports.sha256 = (message) => {
  const hash = crypto.createHash('sha256').update(message).digest('base64');
  return hash;
};
