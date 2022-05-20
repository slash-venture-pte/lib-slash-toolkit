import request from 'request';

export default function oneSignal(data, opts, callback) {
  // Provider
  data.app_id = opts.app_id;

  request({
    url: `${opts.url}/api/v1/notifications`,
    method: 'POST',
    headers: {
      Authorization: `Basic ${opts.client_key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  }, (err, responseText, body) => {
    if (err) {
      root.core.log(err, responseText);
    } else {
      root.core.log(body);
    }
    if (callback) {
      callback(err, body);
    }
  });
}
