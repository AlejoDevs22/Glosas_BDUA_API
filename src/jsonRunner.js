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
  const periodo = payload.periodo ?? payload.period ?? payload.fecha ?? payload.fechaProceso ?? payload.fecha_proceso ?? payload.date ?? null;

  return { proceso, limite, ejecutarJob, periodo };
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

async function runProcess({ proceso, limite = 0, ejecutarJob = false, periodo = null }) {
  if (!proceso) {
    throw new Error('Debe especificarse el proceso. Usa "proceso" en el JSON.');
  }

  console.log(`📌 Proceso: ${proceso} | Límite: ${limite === 0 ? 'sin límite' : limite} registros | Job: ${ejecutarJob ? 'SÍ' : 'NO'}${periodo ? ` | Periodo: ${periodo}` : ''}`);

  let sqlConn = null;
  let oracleConn = null;

  try {
    console.log("🔌 Conectando a SQL Server...");
    sqlConn = await sql.connect(sqlConfig);

    console.log("🔌 Conectando a Oracle...");
    oracleConn = await oracledb.getConnection(oracleConfig);

    await migrar(proceso, sqlConn, oracleConn, limite, periodo);

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

async function runObtenerFechas(procesoNombre) {
  if (!procesoNombre) {
    throw new Error('Debe especificarse el proceso en la URL.');
  }

  const procesos = require("./config/procesos");
  const nombreProceso = procesoNombre.toUpperCase().trim();
  const proceso = procesos[nombreProceso];

  if (!proceso) {
    throw new Error(`Proceso "${nombreProceso}" no encontrado en procesos.js`);
  }

  const campoFechaConfig = proceso.campos.find(c => c.destino === "EGAF_FECHA_PROCESO");
  const campoFechaOrigen = campoFechaConfig ? campoFechaConfig.origen.trim() : null;

  if (!campoFechaOrigen) {
    throw new Error(`El proceso "${nombreProceso}" no tiene un campo de fecha origen mapeado a EGAF_FECHA_PROCESO.`);
  }

  console.log(`📌 Obteniendo fechas del proceso: ${nombreProceso} | Tabla: ${proceso.tablaOrigen} | Campo: ${campoFechaOrigen}`);

  let sqlConn = null;
  let oracleConn = null;
  try {
    let glosasValidas = [];
    if (proceso.filtro) {
      console.log("🔌 Conectando a Oracle para obtener glosas activas...");
      oracleConn = await oracledb.getConnection(oracleConfig);
      
      const queryOracle = `SELECT TRIM(t.egac_codigo_glosa) FROM oasis.EGAB_GLOSA_ADMINISTRATIVA t WHERE t.egac_estdo = 'A'`;
      const resultOracle = await oracleConn.execute(queryOracle);
      glosasValidas = resultOracle.rows.map(row => row[0]);
      console.log(`   ✅ Glosas válidas obtenidas de Oracle: ${glosasValidas.join(", ")}`);
    }

    console.log("🔌 Conectando a SQL Server...");
    sqlConn = await sql.connect(sqlConfig);

    let query = "";
    const request = sqlConn.request();

    if (proceso.filtro && glosasValidas.length > 0) {
      glosasValidas.forEach((glosa, i) => {
        request.input(`glosa${i}`, sql.VarChar, glosa);
      });
      const glosasParamList = glosasValidas.map((_, i) => `@glosa${i}`).join(', ');

      query = `
        SELECT ${campoFechaOrigen} AS fechaProceso
        FROM (
            SELECT DISTINCT
                   ${campoFechaOrigen},
                   CONVERT(DATE, ${campoFechaOrigen}, 103) AS Fecha
            FROM ${proceso.tablaOrigen}
            WHERE CONVERT(DATE, ${campoFechaOrigen}, 103) >= '20260101'
              AND (MIGRADO IS NULL OR MIGRADO != 'S')
              AND SUBSTRING(${proceso.filtro.campoOrigen}, 1, ${proceso.filtro.longitudPrefijo}) IN (${glosasParamList})
        ) T
        ORDER BY Fecha ASC;
      `;
    } else {
      query = `
        SELECT ${campoFechaOrigen} AS fechaProceso
        FROM (
            SELECT DISTINCT
                   ${campoFechaOrigen},
                   CONVERT(DATE, ${campoFechaOrigen}, 103) AS Fecha
            FROM ${proceso.tablaOrigen}
            WHERE CONVERT(DATE, ${campoFechaOrigen}, 103) >= '20260101'
              AND (MIGRADO IS NULL OR MIGRADO != 'S')
        ) T
        ORDER BY Fecha ASC;
      `;
    }

    const resultado = await request.query(query);
    const fechas = resultado.recordset.map(row => row.fechaProceso);
    const fechasFiltradas = fechas.length > 0 ? [fechas[0]] : [];
    
    console.log(`   ✅ Fechas obtenidas: ${fechas.length} encontradas. Retornando la menor: ${fechasFiltradas[0] || 'ninguna'}`);
    return fechasFiltradas;
  } catch (err) {
    console.error("\n💥 Error al obtener fechas:", err.message);
    throw err;
  } finally {
    if (oracleConn) {
      try {
        await oracleConn.close();
      } catch (err) {
        console.error("Error cerrando conexión de Oracle:", err.message);
      }
    }
    if (sqlConn) {
      try {
        await sqlConn.close();
      } catch (err) {
        console.error("Error cerrando conexión de SQL Server:", err.message);
      }
    }
    console.log("🔌 Conexiones cerradas.");
  }
}

async function obtenerFechasMes(procesoNombre, mes, anio) {
  if (!procesoNombre) {
    throw new Error("Debe especificarse el proceso.");
  }
  if (!mes || !anio) {
    throw new Error("Debe especificarse mes y año.");
  }

  const procesos = require("./config/procesos");
  const nombreProceso = procesoNombre.toUpperCase().trim();
  const proceso = procesos[nombreProceso];

  if (!proceso) {
    throw new Error(`Proceso "${nombreProceso}" no encontrado en procesos.js`);
  }

  const campoFechaConfig = proceso.campos.find(c => c.destino === "EGAF_FECHA_PROCESO");
  const campoFechaOrigen = campoFechaConfig ? campoFechaConfig.origen.trim() : null;

  if (!campoFechaOrigen) {
    throw new Error(`El proceso "${nombreProceso}" no tiene un campo de fecha origen mapeado a EGAF_FECHA_PROCESO.`);
  }

  console.log(`📌 Buscando fechas del proceso: ${nombreProceso} | Mes: ${mes}/${anio}`);

  let sqlConn = null;
  let oracleConn = null;
  try {
    let glosasValidas = [];
    if (proceso.filtro) {
      console.log("🔌 Conectando a Oracle para obtener glosas activas...");
      oracleConn = await oracledb.getConnection(oracleConfig);
      
      const queryOracle = `SELECT TRIM(t.egac_codigo_glosa) FROM oasis.EGAB_GLOSA_ADMINISTRATIVA t WHERE t.egac_estdo = 'A'`;
      const resultOracle = await oracleConn.execute(queryOracle);
      glosasValidas = resultOracle.rows.map(row => row[0]);
      console.log(`   ✅ Glosas válidas obtenidas de Oracle: ${glosasValidas.join(", ")}`);
    }

    console.log("🔌 Conectando a SQL Server...");
    sqlConn = await sql.connect(sqlConfig);

    let query = "";
    const request = sqlConn.request();
    request.input('mes', sql.Int, parseInt(mes, 10));
    request.input('anio', sql.Int, parseInt(anio, 10));

    if (proceso.filtro && glosasValidas.length > 0) {
      glosasValidas.forEach((glosa, i) => {
        request.input(`glosa${i}`, sql.VarChar, glosa);
      });
      const glosasParamList = glosasValidas.map((_, i) => `@glosa${i}`).join(', ');

      query = `
        SELECT ${campoFechaOrigen} AS fechaProceso
        FROM (
            SELECT DISTINCT
                   ${campoFechaOrigen},
                   CONVERT(DATE, ${campoFechaOrigen}, 103) AS Fecha
            FROM dbo.${proceso.tablaOrigen}
            WHERE CONVERT(DATE, ${campoFechaOrigen}, 103) >= '20260101'
              AND (MIGRADO IS NULL OR MIGRADO != 'S')
              AND MONTH(CONVERT(DATE, ${campoFechaOrigen}, 103)) = @mes
              AND YEAR(CONVERT(DATE, ${campoFechaOrigen}, 103)) = @anio
              AND SUBSTRING(${proceso.filtro.campoOrigen.trim()}, 1, ${proceso.filtro.longitudPrefijo}) IN (${glosasParamList})
        ) T
        ORDER BY Fecha ASC;
      `;
    } else {
      query = `
        SELECT ${campoFechaOrigen} AS fechaProceso
        FROM (
            SELECT DISTINCT
                   ${campoFechaOrigen},
                   CONVERT(DATE, ${campoFechaOrigen}, 103) AS Fecha
            FROM dbo.${proceso.tablaOrigen}
            WHERE CONVERT(DATE, ${campoFechaOrigen}, 103) >= '20260101'
              AND (MIGRADO IS NULL OR MIGRADO != 'S')
              AND MONTH(CONVERT(DATE, ${campoFechaOrigen}, 103)) = @mes
              AND YEAR(CONVERT(DATE, ${campoFechaOrigen}, 103)) = @anio
        ) T
        ORDER BY Fecha ASC;
      `;
    }

    const resultado = await request.query(query);
    const fechas = resultado.recordset.map(row => row.fechaProceso);
    console.log(`   ✅ Fechas encontradas para el mes ${mes}/${anio}: [${fechas.join(", ")}]`);
    return fechas;
  } finally {
    if (oracleConn) {
      try { await oracleConn.close(); } catch (err) {
        console.error("Error cerrando conexión de Oracle en obtenerFechasMes:", err.message);
      }
    }
    if (sqlConn) {
      try { await sqlConn.close(); } catch (err) {
        console.error("Error cerrando conexión de SQL Server en obtenerFechasMes:", err.message);
      }
    }
    console.log("🔌 Conexiones cerradas.");
  }
}

async function runProcessMes({ proceso, mes, anio, ejecutarJob = false, limite = 0 }) {
  const fechas = await obtenerFechasMes(proceso, mes, anio);

  if (fechas.length === 0) {
    console.log(`⚠️ No se encontraron fechas pendientes para el proceso ${proceso} en el mes ${mes}/${anio}.`);
    return { proceso, mes, anio, totalFechas: 0, resultados: [] };
  }

  console.log(`🚀 Iniciando migración mensual para ${proceso} | ${fechas.length} fecha(s) encontrada(s): [${fechas.join(", ")}]`);

  const resultados = [];
  for (const fecha of fechas) {
    console.log(`\n-----------------------------------------`);
    console.log(`📅 Migrando fecha: ${fecha}`);
    console.log(`-----------------------------------------`);

    try {
      const res = await runProcess({ proceso, limite, ejecutarJob, periodo: fecha });
      resultados.push({ fecha, status: "success", details: res });
    } catch (err) {
      console.error(`❌ Error migrando fecha ${fecha}:`, err.message);
      resultados.push({ fecha, status: "error", error: err.message });
    }
  }

  return {
    proceso,
    mes,
    anio,
    totalFechas: fechas.length,
    resultados
  };
}

module.exports = { parseJsonPayload, runProcess, runObtenerFechas, runProcessMes };
