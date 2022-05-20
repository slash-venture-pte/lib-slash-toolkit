import email from './email';

/**
 * Send error email
 * @param {*} opts id of transaction { id: 'ID', to: 'TO', v: 'Path to email template', serverName: 'serverName' }
 * @param {*} er error data
 * @param {*} req req object
 * @param {*} options options
 */
exports.email = async (opts, er, req) => {
  try {
    await email.send({
      to: opts.to,
      templateName: `${opts.template}/email-notify.html`,
      model: {
        serverName: opts.serverName,
        id: opts.id,
        url: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
        body: JSON.stringify(req.body),
        trace: er.stack,
        headers: JSON.stringify(req.headers),
      },
      subject: `Error Report from Server - #${opts.id}`,
    });
  } catch (e) {
    root.core.error('[error] Notify error has a problem! ', e.message);
  }
};
