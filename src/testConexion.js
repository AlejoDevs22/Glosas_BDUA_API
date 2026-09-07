require('dotenv').config();
const sql = require('mssql');
const oracledb = require('oracledb');
const sqlServerConfig = require('./config/sqlserver');
const oracleConfig = require('./config/oracle');

async function testSqlServer() {
  const config = { ...sqlServerConfig };

  // El archivo config/sqlserver.js ya genera la propiedad `server`.
  // Si todavía existiera `host`, la convertimos para compatibilidad.
  if (!config.server && config.host) {
    if (String(config.host).includes('\\')) {
      const [server, instanceName] = String(config.host).split('\\');
      config.server = server;
      config.options = {
        ...config.options,
        instanceName,
        encrypt: false,
        trustServerCertificate: true
      };
      delete config.host;
    } else {
      config.server = config.host;
    }
  }

  console.log('Probando conexión SQL Server...');
  const pool = await sql.connect(config);
  await pool.close();
  console.log('✅ Conexión SQL Server exitosa');
}

async function testOracle() {
  console.log('Probando conexión Oracle...');
  const connection = await oracledb.getConnection(oracleConfig);
  await connection.close();
  console.log('✅ Conexión Oracle exitosa');
}

async function main() {
  try {
    await testSqlServer();
  } catch (err) {
    console.error('❌ Error en conexión SQL Server:', err.message || err);
  }

  try {
    await testOracle();
  } catch (err) {
    console.error('❌ Error en conexión Oracle:', err.message || err);
  }
}

main();
