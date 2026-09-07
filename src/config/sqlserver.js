require('dotenv').config();

const rawHost = process.env.SQLSERVER_HOST || '';
const config = {
  port: Number(process.env.SQLSERVER_PORT || 1433),
  user: process.env.SQLSERVER_USER,
  password: process.env.SQLSERVER_PASSWORD,
  database: process.env.SQLSERVER_DATABASE,
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};

if (rawHost.includes('\\')) {
  const [server, instanceName] = rawHost.split('\\');
  config.server = server;
  config.options.instanceName = instanceName;
} else {
  config.server = rawHost;
}

module.exports = config;
