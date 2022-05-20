// cache.js
/*
  Caching system
*/
import Promise from 'bluebird';
import redis from 'redis';

import appLog from '../utils/log';

/**
 * Initialize redis
 * @param {*} data {
    port: PORT,
    host: HOST,
    options: {
      db: 0
    }
   }
 */
exports.redisInit = (data) => {
  try {
    Promise.promisifyAll(redis.RedisClient.prototype);
    Promise.promisifyAll(redis.Multi.prototype);
    const client = redis.createClient(data.port, data.host, data.options);

    if (data.options.db !== undefined) {
      appLog.log('Select redis database', data.options.db, data.options.db * 1);
      client.select(data.options.db * 1);
    }
    return client;
  } catch (er) {
    appLog.error(`Memstore/redis.js::__func -> Error ${er.message}`, er.stack);
    return null;
  }
};

/**
 * Create memory store from db
 * @param {*} config {
    port: 6379,
    host: '127.0.0.1',
    options: {
      parser: 'javascript',
      return_buffers: false,
      detect_buffers: false,
      socket_nodelay: true,
      socket_keepalive: true,
      no_ready_check: false,
      enable_offline_queue: true,
      retry_max_delay: null,
      connect_timeout: false,
      max_attempts: null,
      auth_pass: '7512e29188b6#$Tdf64&&*1!B',
      family: 'IPv4',
      db: 1,
    },
  }
 */
exports.createMemStore = (config) => {
  const opts = config || {
    port: 6379,
    host: '127.0.0.1',
    options: {
      parser: 'javascript',
      return_buffers: false,
      detect_buffers: false,
      socket_nodelay: true,
      socket_keepalive: true,
      no_ready_check: false,
      enable_offline_queue: true,
      retry_max_delay: null,
      connect_timeout: false,
      max_attempts: null,
      auth_pass: null,
      family: 'IPv4',
      db: 1,
    },
  };

  return exports.redisInit(opts);
};

/**
 * Get cache data by key
 * @param { string } key Redis/memory store item key
 * @param { Memory Store } memstore Memory store instance
 */
exports.fetch = async (memStore, key) => {
  key = `CACHE:${key}`;
  const cache = await memStore.context.getAsync(key);

  if (!cache) {
    return null;
  }
  // root.core.log("key", key, cache);
  return JSON.parse(cache);
};

/**
 * Fetch and delete
 * @param { string } key Redis/memory store item key
 * @param { Memory Store } memstore Memory store instance
 */
exports.fetchAndDelete = async (key, memStore) => {
  key = `CACHE:${key}`;
  const cache = await memStore.context.getAsync(key);

  if (!cache) {
    return null;
  }
  await memStore.context.delAsync(key);
  return JSON.parse(cache);
};

/**
 * Delete cache data by key
 * @param { string } key Redis/memory store item key
 * @param { Memory Store } memstore Memory store instance
 */
exports.delete = async (memStore, key) => {
  key = `CACHE:${key}`;
  const cache = await memStore.context.delAsync(key);
  return !!cache;
};

/**
 * Get cache data by key
 * @param { string } key Redis/memory store item key
 * @param { string } data Redis/memory to store
 * @param { int } expired Expired in seconds
 * @param { Memory Store } memstore Memory store instance
 */
exports.put = async (memStore, key, data, expired) => {
  key = `CACHE:${key}`;
  if (expired) {
    memStore.context.set(key, JSON.stringify(data), 'EX', expired);
  } else {
    memStore.context.set(key, JSON.stringify(data));
  }
  // console.log("get", await memStore.context.getAsync(key),JSON.parse( await memStore.context.getAsync(key)));
};

/**
 * Get cache data by key
 * @param { string } key Redis/memory store item key
 * @param { string } data Redis/memory to store
 * @param { int } expired Expired in seconds
 * @param { Memory Store } memstore Memory store instance
 */
exports.putIfNotExists = async (memStore, key, data, expired) => {
  key = `CACHE:${key}`;
  const cache = await exports.fetch(key);
  if (!cache) {
    return memStore.context.set(key, JSON.stringify(data), 'EX', expired);
  }
  return cache;
};
