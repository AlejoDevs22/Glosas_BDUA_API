require("dotenv").config();
const sql = require("mssql");
const oracledb = require("oracledb");
const sqlConfig = require("./config/sqlserver");
const oracleConfig = require("./config/oracle");
const { migrar } = require("./migration/migrar");

function parseJsonPayload(payloadInput) {
  let payload = payloadInput;

  if (typeof payloadInput === "string") {
    try {
      payload = JSON.parse(payloadInput);
    } catch (err) {
      throw new Error("JSON inválido. Debe ser un objeto JSON válido.");
    }
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("El JSON debe ser un objeto con las propiedades requeridas.");
  }

  const proceso = String(payload.proceso || payload.proceso?.toString() || "").trim().toUpperCase();
  if (!proceso) {
    throw new Error('Debe incluir la propiedad "proceso" con valores como "MC", "NC", "NS", etc.');
  }

  const cantidad = payload.cantidad ?? payload.cant ?? payload.limite ?? payload.limit;
  let limite = 0;
  if (cantidad !== undefined && cantidad !== null && String(cantidad).trim() !== "") {
    const numero = Number(cantidad);
    if (Number.isFinite(numero) && numero > 0) {
      limite = Math.trunc(numero);
    }
  }

  const ejecutarJob = parseJobFlag(payload.j ?? payload.job ?? payload.ejecutarJob);

  return { proceso, limite, ejecutarJob };
}

function parseJobFlag(value) {
  if (value === undefined || value === null) return false;
  if (typeof value === "boolean") return value;
  const normalized = String(value).trim().toUpperCase();
  return normalized === "J" || normalized === "YES" || normalized === "TRUE" || normalized === "1";
}

async function ejecutarJobOracle(oracleConn, proceso) {
  console.log("\n🔧 Ejecutando job de Oracle...");
  try {
    const result = await oracleConn.execute(
      "BEGIN pq_gestion_glosa_bdua.P_CREAR_JOB_GLOSAS(p_proceso => :p_proceso, p_resp => :p_resp); END;",
      { p_proceso: proceso, p_resp: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 4000 } },
      { autoCommit: true }
    );
    console.log(`   ✅ Job ejecutado. Respuesta: ${result.outBinds.p_resp}`);
  } catch (err) {
    console.error("   ❌ Error ejecutando job:", err.message);
  }
}

async function runProcess({ proceso, limite = 0, ejecutarJob = false }) {
  if (!proceso) {
    throw new Error('Debe especificarse el proceso. Usa "proceso" en el JSON.');
  }

  console.log(`📌 Proceso: ${proceso} | Límite: ${limite === 0 ? 'sin límite' : limite} registros | Job: ${ejecutarJob ? 'SÍ' : 'NO'}`);

  let sqlConn = null;
  let oracleConn = null;

  try {
    console.log("🔌 Conectando a SQL Server...");
    sqlConn = await sql.connect(sqlConfig);

    console.log("🔌 Conectando a Oracle...");
    oracleConn = await oracledb.getConnection(oracleConfig);

    await migrar(proceso, sqlConn, oracleConn, limite);

    if (ejecutarJob) {
      await ejecutarJobOracle(oracleConn, proceso);
    }

    return { proceso, limite, ejecutarJob };
  } catch (err) {
    console.error("\n💥 Error general:", err.message);
    throw err;
  } finally {
    if (sqlConn) await sqlConn.close();
    if (oracleConn) await oracleConn.close();
    console.log("\n🔌 Conexiones cerradas.");
  }
}

module.exports = { parseJsonPayload, runProcess };
