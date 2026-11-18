const path = require("node:path");

require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

function getOracleConfig() {
  const user = process.env.ORACLE_USER;
  const password = process.env.ORACLE_PASSWORD;
  const connectString = (
    process.env.ORACLE_CONNECT_STRING || process.env.ORACLE_CONNECTION_STRING || ""
  ).trim();

  const missing = [];
  if (!user) missing.push("ORACLE_USER");
  if (!password) missing.push("ORACLE_PASSWORD");
  if (!connectString) {
    missing.push("ORACLE_CONNECT_STRING (o ORACLE_CONNECTION_STRING)");
  }

  if (missing.length > 0) {
    throw new Error(
      `Configuración Oracle incompleta: falta(n) ${missing.join(", ")}. ` +
      "Defina estas variables en el entorno del servicio o en el .env ubicado en la raíz del proyecto."
    );
  }

  return { user, password, connectString };
}

module.exports = getOracleConfig;
