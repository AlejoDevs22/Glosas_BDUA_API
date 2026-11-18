<<<<<<< HEAD
// src/migration/migrar.js
const sql = require("mssql");
const procesos = require("../config/procesos");

// Función para actualizar EGAP_PROCESOS - solo progreso
async function actualizarProceso(oracleConn, nombreProceso, progreso) {
  // Si progreso viene como string "X/Y", guardar el formato "X/Y"
  let progresoValor = progreso;
  if (typeof progreso === 'string' && progreso.includes('/')) {
    const [insertados, total] = progreso.split('/').map(Number);
    // Calcular porcentaje con 3 decimales
    const porcentaje = total > 0 ? ((insertados / total) * 100).toFixed(3) : 0;
    progresoValor = `${insertados}/${total} (${porcentaje}%)`;
  }

  // UPDATE oasis.EGAP_PROCESOS s SET s.egac_progreso = v_progreso WHERE s.egac_proceso = v_proceso
  const sqlUpdate = `UPDATE oasis.egap_procesos_bdua s 
                     SET s.egac_progreso = :1
                     WHERE s.egac_proceso = :2`;

  try {
    const result = await oracleConn.execute(sqlUpdate, [progresoValor, nombreProceso], { autoCommit: true });
    console.log(`   📊 EGAP_PROCESOS_BDUA actualizada - Filas: ${result.rowsAffected}, Progreso: ${progresoValor}`);
  } catch (err) {
    console.error(`   ⚠️  Error actualizando EGAP_PROCESOS_BDUA:`, err.message);
  }
}

// Función para marcar en SQL Server los registros que fueron migrados con éxito
async function marcarComoMigrados(sqlConn, tabla, campoTipoDoc, campoNumDoc, campoFecha, campoGlosa, claveControl, items) {
  if (!items || items.length === 0) return;
  try {
    const request = sqlConn.request();
    let whereClauses = [];
    
    for (let i = 0; i < items.length; i++) {
      if (claveControl && items[i].claveControlVal !== undefined && items[i].claveControlVal !== null) {
        const cParam = `c${i}`;
        request.input(cParam, sql.VarChar, items[i].claveControlVal);
        whereClauses.push(`${claveControl} = @${cParam}`);
      } else {
        const tParam = `t${i}`;
        const nParam = `n${i}`;
        request.input(tParam, sql.VarChar, items[i].tipoDoc);
        request.input(nParam, sql.VarChar, items[i].numDoc);
        
        let itemClause = `${campoTipoDoc} = @${tParam} AND ${campoNumDoc} = @${nParam}`;
        
        if (campoFecha && items[i].fecha) {
          const fParam = `f${i}`;
          request.input(fParam, sql.VarChar, items[i].fecha);
          itemClause += ` AND ${campoFecha} = @${fParam}`;
        }

        if (campoGlosa && items[i].glosa) {
          const gParam = `g${i}`;
          request.input(gParam, sql.VarChar, items[i].glosa);
          itemClause += ` AND ${campoGlosa} = @${gParam}`;
        }
        
        whereClauses.push(`(${itemClause})`);
      }
    }
    
    const query = `UPDATE dbo.${tabla} SET MIGRADO = 'S' WHERE ${whereClauses.join(' OR ')}`;
    await request.query(query);
    console.log(`   📝 ${items.length} registros marcados como MIGRADOS ('S') en SQL Server.`);
  } catch (err) {
    console.error(`   ⚠️ Error marcando registros como MIGRADOS en SQL Server:`, err.message);
  }
}

async function migrar(nombreProceso, sqlConn, oracleConn, limite = 0, periodo = null) {
  const proceso = procesos[nombreProceso];

  if (!proceso) {
    throw new Error(`Proceso "${nombreProceso}" no encontrado en procesos.js`);
  }

  console.log(`\n🚀 Iniciando proceso: ${proceso.nombre}`);
  console.log(`   Origen  → ${proceso.tablaOrigen}`);
  console.log(`   Destino → ${proceso.tablaDestino}`);
  console.log(`   Límite  → ${limite === 0 ? 'sin límite' : limite} registros`);
  if (periodo) console.log(`   Periodo → ${periodo}`);

  // Actualizar EGAP_PROCESOS - Inicio del proceso
  await actualizarProceso(oracleConn, nombreProceso, 0);

  // 1. Si existe filtro, obtener códigos válidos de Oracle
  let codigosValidos = null;
  if (proceso.filtro) {
    console.log(`\n🔍 Obteniendo códigos de glosa válidos desde Oracle...`);
    try {
      let consultaValidacion = proceso.filtro.consultaValidacion;
      const resultadoOracle = await oracleConn.execute(consultaValidacion);
      codigosValidos = new Set(resultadoOracle.rows.map(row => row[0]));
      console.log(`   ${codigosValidos.size} códigos de glosa encontrados`);
    } catch (err) {
      console.error(`   ❌ Error obteniendo códigos de validación:`, err.message);
      return { insertados: 0, omitidos: 0, errores: 0 };
    }
  }

  // 2. Leer datos desde SQL Server
  const campoFechaConfig = proceso.campos.find(c => c.destino === "EGAF_FECHA_PROCESO");
  const campoFechaOrigen = campoFechaConfig ? campoFechaConfig.origen : null;
  
  const campoGlosaConfig = proceso.campos.find(c => c.destino === "EGAC_GLOSA_PROCESO");
  const campoGlosaOrigen = campoGlosaConfig ? campoGlosaConfig.origen : null;

  const campoTipoDocConfig = proceso.campos.find(c => c.destino === "EGAC_TIPO_DOCUMENTO");
  const campoNumDocConfig = proceso.campos.find(c => c.destino === "EGAC_NUMERO_DOCUMENTO");
  const campoTipoDocOrigen = campoTipoDocConfig ? campoTipoDocConfig.origen : null;
  const campoNumDocOrigen = campoNumDocConfig ? campoNumDocConfig.origen : null;

  const claveControl = proceso.claveControl ? proceso.claveControl.trim() : null;

  // Asegurar que traemos también los campos llave para poder marcar después
  const camposRequeridosSet = new Set(
    proceso.campos
      .filter(c => c.origen)
      .map(c => c.origen.trim())
  );
  if (campoTipoDocOrigen) camposRequeridosSet.add(campoTipoDocOrigen.trim());
  if (campoNumDocOrigen) camposRequeridosSet.add(campoNumDocOrigen.trim());
  if (campoGlosaOrigen) camposRequeridosSet.add(campoGlosaOrigen.trim());
  if (claveControl) camposRequeridosSet.add(claveControl);

  const camposOrigen = Array.from(camposRequeridosSet).join(", ");

  let query = `SELECT ${limite > 0 ? `TOP ${limite}` : ''} ${camposOrigen} 
               FROM dbo.${proceso.tablaOrigen}
               WHERE (MIGRADO IS NULL OR MIGRADO != 'S')`;

  const request = sqlConn.request();
  if (periodo && campoFechaOrigen) {
    query += ` AND ${campoFechaOrigen.trim()} = @periodo`;
    console.log(`   🎯 Aplicando filtro por periodo: ${campoFechaOrigen.trim()} = '${periodo}'`);
    request.input('periodo', sql.VarChar, periodo);
  }

  console.log(`\n📥 Leyendo datos de SQL Server...`);

  const resultado = await request.query(query);
  let filas = resultado.recordset;
  console.log(`   ${filas.length} registros encontrados`);

  // Aplicar filtro si existe
  if (codigosValidos !== null && proceso.filtro) {
    const filasAntes = filas.length;
    filas = filas.filter(fila => {
      const prefijo = String(fila[proceso.filtro.campoOrigen.trim()] || "").substring(0, proceso.filtro.longitudPrefijo);
      return codigosValidos.has(prefijo);
    });
    console.log(`   Después del filtro: ${filas.length} registros (${filasAntes - filas.length} omitidos)`);
  }

  if (filas.length === 0) {
    console.log("   ⚠️  Sin datos para migrar.");
    return { insertados: 0, omitidos: 0, errores: 0 };
  }

  // 3. Insertar en Oracle (validación de duplicados manejada por Oracle)
  let insertados = 0;
  let errores = 0;

  const camposDestino = proceso.campos.map(c => c.destino);
  const bindKeys = proceso.campos.map((_, i) => `:${i + 1}`);

  const sqlInsert = `INSERT INTO ${proceso.tablaDestino} (${camposDestino.join(", ")})
                     VALUES (${bindKeys.join(", ")})`;

  const COMMIT_BATCH = 100;
  console.log(`\n📤 Insertando en Oracle...`);

  let batchMigrados = [];

  for (let index = 0; index < filas.length; index++) {
    const fila = filas[index];

    try {
      const valores = proceso.campos.map(c =>
        c.hasOwnProperty("valor") ? c.valor : (c.origen ? fila[c.origen.trim()] : null) ?? null
      );
      await oracleConn.execute(sqlInsert, valores, { autoCommit: false });
      insertados++;

      if (claveControl || (campoTipoDocOrigen && campoNumDocOrigen)) {
        batchMigrados.push({
          claveControlVal: claveControl ? fila[claveControl] : null,
          tipoDoc: campoTipoDocOrigen ? fila[campoTipoDocOrigen.trim()] : null,
          numDoc: campoNumDocOrigen ? fila[campoNumDocOrigen.trim()] : null,
          fecha: campoFechaOrigen ? fila[campoFechaOrigen.trim()] : null,
          glosa: campoGlosaOrigen ? fila[campoGlosaOrigen.trim()] : null
        });
      }

      if ((index + 1) % COMMIT_BATCH === 0) {
        await oracleConn.commit();

        // Actualizar SQL Server
        if (batchMigrados.length > 0 && (claveControl || (campoTipoDocOrigen && campoNumDocOrigen))) {
          await marcarComoMigrados(
            sqlConn,
            proceso.tablaOrigen,
            campoTipoDocOrigen ? campoTipoDocOrigen.trim() : null,
            campoNumDocOrigen ? campoNumDocOrigen.trim() : null,
            campoFechaOrigen ? campoFechaOrigen.trim() : null,
            campoGlosaOrigen ? campoGlosaOrigen.trim() : null,
            claveControl,
            batchMigrados
          );
          batchMigrados = [];
        }

        // Actualizar progreso en cada commit: insertados/total
        const progreso = Math.floor((insertados / filas.length) * 100);
        await actualizarProceso(oracleConn, nombreProceso, `${insertados}/${filas.length}`);
        console.log(`   🔄 Commit intermedio luego de ${index + 1} filas procesadas - Progreso: ${progreso}%`);
      }

      if ((index + 1) % 50 === 0) {
        console.log(`   ⏳ ${index + 1}/${filas.length} filas procesadas...`);
      }

    } catch (err) {
      errores++;
      console.error(`   ❌ Error en fila ${index + 1}:`, err.message);
    }
  }

  if (insertados > 0) {
    await oracleConn.commit();

    // Actualizar SQL Server para el lote final restante
    if (batchMigrados.length > 0 && (claveControl || (campoTipoDocOrigen && campoNumDocOrigen))) {
      await marcarComoMigrados(
        sqlConn,
        proceso.tablaOrigen,
        campoTipoDocOrigen ? campoTipoDocOrigen.trim() : null,
        campoNumDocOrigen ? campoNumDocOrigen.trim() : null,
        campoFechaOrigen ? campoFechaOrigen.trim() : null,
        campoGlosaOrigen ? campoGlosaOrigen.trim() : null,
        claveControl,
        batchMigrados
      );
      batchMigrados = [];
    }

    // Actualizar progreso final
    await actualizarProceso(oracleConn, nombreProceso, `${insertados}/${filas.length}`);
  }

  console.log(`\n✅ Proceso "${proceso.nombre}" finalizado:`);
  console.log(`   Insertados : ${insertados}`);
  console.log(`   Errores    : ${errores}`);

  // Actualizar EGAP_PROCESOS - Fin del proceso
  await actualizarProceso(oracleConn, nombreProceso, `${insertados}/${filas.length}`);

  return { insertados, errores };
}

=======
// src/migration/migrar.js
const sql = require("mssql");
const procesos = require("../config/procesos");

// Función para actualizar EGAP_PROCESOS - solo progreso
async function actualizarProceso(oracleConn, nombreProceso, progreso) {
  // Si progreso viene como string "X/Y", guardar el formato "X/Y"
  let progresoValor = progreso;
  if (typeof progreso === 'string' && progreso.includes('/')) {
    const [insertados, total] = progreso.split('/').map(Number);
    // Calcular porcentaje con 3 decimales
    const porcentaje = total > 0 ? ((insertados / total) * 100).toFixed(3) : 0;
    progresoValor = `${insertados}/${total} (${porcentaje}%)`;
  }

  // UPDATE oasis.EGAP_PROCESOS s SET s.egac_progreso = v_progreso WHERE s.egac_proceso = v_proceso
  const sqlUpdate = `UPDATE oasis.egap_procesos_bdua s 
                     SET s.egac_progreso = :1
                     WHERE s.egac_proceso = :2`;

  try {
    const result = await oracleConn.execute(sqlUpdate, [progresoValor, nombreProceso], { autoCommit: true });
    console.log(`   📊 EGAP_PROCESOS_BDUA actualizada - Filas: ${result.rowsAffected}, Progreso: ${progresoValor}`);
  } catch (err) {
    console.error(`   ⚠️  Error actualizando EGAP_PROCESOS_BDUA:`, err.message);
  }
}

// Función para marcar en SQL Server los registros que fueron migrados con éxito
async function marcarComoMigrados(sqlConn, tabla, campoTipoDoc, campoNumDoc, campoFecha, campoGlosa, claveControl, items) {
  if (!items || items.length === 0) return;
  try {
    const request = sqlConn.request();
    let whereClauses = [];
    
    for (let i = 0; i < items.length; i++) {
      if (claveControl && items[i].claveControlVal !== undefined && items[i].claveControlVal !== null) {
        const cParam = `c${i}`;
        request.input(cParam, sql.VarChar, items[i].claveControlVal);
        whereClauses.push(`${claveControl} = @${cParam}`);
      } else {
        const tParam = `t${i}`;
        const nParam = `n${i}`;
        request.input(tParam, sql.VarChar, items[i].tipoDoc);
        request.input(nParam, sql.VarChar, items[i].numDoc);
        
        let itemClause = `${campoTipoDoc} = @${tParam} AND ${campoNumDoc} = @${nParam}`;
        
        if (campoFecha && items[i].fecha) {
          const fParam = `f${i}`;
          request.input(fParam, sql.VarChar, items[i].fecha);
          itemClause += ` AND ${campoFecha} = @${fParam}`;
        }

        if (campoGlosa && items[i].glosa) {
          const gParam = `g${i}`;
          request.input(gParam, sql.VarChar, items[i].glosa);
          itemClause += ` AND ${campoGlosa} = @${gParam}`;
        }
        
        whereClauses.push(`(${itemClause})`);
      }
    }
    
    const query = `UPDATE dbo.${tabla} SET MIGRADO = 'S' WHERE ${whereClauses.join(' OR ')}`;
    await request.query(query);
    console.log(`   📝 ${items.length} registros marcados como MIGRADOS ('S') en SQL Server.`);
  } catch (err) {
    console.error(`   ⚠️ Error marcando registros como MIGRADOS en SQL Server:`, err.message);
  }
}

async function migrar(nombreProceso, sqlConn, oracleConn, limite = 0, periodo = null) {
  const proceso = procesos[nombreProceso];

  if (!proceso) {
    throw new Error(`Proceso "${nombreProceso}" no encontrado en procesos.js`);
  }

  console.log(`\n🚀 Iniciando proceso: ${proceso.nombre}`);
  console.log(`   Origen  → ${proceso.tablaOrigen}`);
  console.log(`   Destino → ${proceso.tablaDestino}`);
  console.log(`   Límite  → ${limite === 0 ? 'sin límite' : limite} registros`);
  if (periodo) console.log(`   Periodo → ${periodo}`);

  // Actualizar EGAP_PROCESOS - Inicio del proceso
  await actualizarProceso(oracleConn, nombreProceso, 0);

  // 1. Si existe filtro, obtener códigos válidos de Oracle
  let codigosValidos = null;
  if (proceso.filtro) {
    console.log(`\n🔍 Obteniendo códigos de glosa válidos desde Oracle...`);
    try {
      let consultaValidacion = proceso.filtro.consultaValidacion;
      const resultadoOracle = await oracleConn.execute(consultaValidacion);
      codigosValidos = new Set(resultadoOracle.rows.map(row => row[0]));
      console.log(`   ${codigosValidos.size} códigos de glosa encontrados`);
    } catch (err) {
      console.error(`   ❌ Error obteniendo códigos de validación:`, err.message);
      return { insertados: 0, omitidos: 0, errores: 0 };
    }
  }

  // 2. Leer datos desde SQL Server
  const campoFechaConfig = proceso.campos.find(c => c.destino === "EGAF_FECHA_PROCESO");
  const campoFechaOrigen = campoFechaConfig ? campoFechaConfig.origen : null;
  
  const campoGlosaConfig = proceso.campos.find(c => c.destino === "EGAC_GLOSA_PROCESO");
  const campoGlosaOrigen = campoGlosaConfig ? campoGlosaConfig.origen : null;

  const campoTipoDocConfig = proceso.campos.find(c => c.destino === "EGAC_TIPO_DOCUMENTO");
  const campoNumDocConfig = proceso.campos.find(c => c.destino === "EGAC_NUMERO_DOCUMENTO");
  const campoTipoDocOrigen = campoTipoDocConfig ? campoTipoDocConfig.origen : null;
  const campoNumDocOrigen = campoNumDocConfig ? campoNumDocConfig.origen : null;

  const claveControl = proceso.claveControl ? proceso.claveControl.trim() : null;

  // Asegurar que traemos también los campos llave para poder marcar después
  const camposRequeridosSet = new Set(
    proceso.campos
      .filter(c => c.origen)
      .map(c => c.origen.trim())
  );
  if (campoTipoDocOrigen) camposRequeridosSet.add(campoTipoDocOrigen.trim());
  if (campoNumDocOrigen) camposRequeridosSet.add(campoNumDocOrigen.trim());
  if (campoGlosaOrigen) camposRequeridosSet.add(campoGlosaOrigen.trim());
  if (claveControl) camposRequeridosSet.add(claveControl);

  const camposOrigen = Array.from(camposRequeridosSet).join(", ");

  let query = `SELECT ${limite > 0 ? `TOP ${limite}` : ''} ${camposOrigen} 
               FROM dbo.${proceso.tablaOrigen}
               WHERE (MIGRADO IS NULL OR MIGRADO != 'S')`;

  const request = sqlConn.request();
  if (periodo && campoFechaOrigen) {
    query += ` AND ${campoFechaOrigen.trim()} = @periodo`;
    console.log(`   🎯 Aplicando filtro por periodo: ${campoFechaOrigen.trim()} = '${periodo}'`);
    request.input('periodo', sql.VarChar, periodo);
  }

  console.log(`\n📥 Leyendo datos de SQL Server...`);

  const resultado = await request.query(query);
  let filas = resultado.recordset;
  console.log(`   ${filas.length} registros encontrados`);

  // Aplicar filtro si existe
  if (codigosValidos !== null && proceso.filtro) {
    const filasAntes = filas.length;
    filas = filas.filter(fila => {
      const prefijo = String(fila[proceso.filtro.campoOrigen.trim()] || "").substring(0, proceso.filtro.longitudPrefijo);
      return codigosValidos.has(prefijo);
    });
    console.log(`   Después del filtro: ${filas.length} registros (${filasAntes - filas.length} omitidos)`);
  }

  if (filas.length === 0) {
    console.log("   ⚠️  Sin datos para migrar.");
    return { insertados: 0, omitidos: 0, errores: 0 };
  }

  // 3. Insertar en Oracle (validación de duplicados manejada por Oracle)
  let insertados = 0;
  let errores = 0;

  const camposDestino = proceso.campos.map(c => c.destino);
  const bindKeys = proceso.campos.map((_, i) => `:${i + 1}`);

  const sqlInsert = `INSERT INTO ${proceso.tablaDestino} (${camposDestino.join(", ")})
                     VALUES (${bindKeys.join(", ")})`;

  const COMMIT_BATCH = 100;
  console.log(`\n📤 Insertando en Oracle...`);

  let batchMigrados = [];

  for (let index = 0; index < filas.length; index++) {
    const fila = filas[index];

    try {
      const valores = proceso.campos.map(c =>
        c.hasOwnProperty("valor") ? c.valor : (c.origen ? fila[c.origen.trim()] : null) ?? null
      );
      await oracleConn.execute(sqlInsert, valores, { autoCommit: false });
      insertados++;

      if (claveControl || (campoTipoDocOrigen && campoNumDocOrigen)) {
        batchMigrados.push({
          claveControlVal: claveControl ? fila[claveControl] : null,
          tipoDoc: campoTipoDocOrigen ? fila[campoTipoDocOrigen.trim()] : null,
          numDoc: campoNumDocOrigen ? fila[campoNumDocOrigen.trim()] : null,
          fecha: campoFechaOrigen ? fila[campoFechaOrigen.trim()] : null,
          glosa: campoGlosaOrigen ? fila[campoGlosaOrigen.trim()] : null
        });
      }

      if ((index + 1) % COMMIT_BATCH === 0) {
        await oracleConn.commit();

        // Actualizar SQL Server
        if (batchMigrados.length > 0 && (claveControl || (campoTipoDocOrigen && campoNumDocOrigen))) {
          await marcarComoMigrados(
            sqlConn,
            proceso.tablaOrigen,
            campoTipoDocOrigen ? campoTipoDocOrigen.trim() : null,
            campoNumDocOrigen ? campoNumDocOrigen.trim() : null,
            campoFechaOrigen ? campoFechaOrigen.trim() : null,
            campoGlosaOrigen ? campoGlosaOrigen.trim() : null,
            claveControl,
            batchMigrados
          );
          batchMigrados = [];
        }

        // Actualizar progreso en cada commit: insertados/total
        const progreso = Math.floor((insertados / filas.length) * 100);
        await actualizarProceso(oracleConn, nombreProceso, `${insertados}/${filas.length}`);
        console.log(`   🔄 Commit intermedio luego de ${index + 1} filas procesadas - Progreso: ${progreso}%`);
      }

      if ((index + 1) % 50 === 0) {
        console.log(`   ⏳ ${index + 1}/${filas.length} filas procesadas...`);
      }

    } catch (err) {
      errores++;
      console.error(`   ❌ Error en fila ${index + 1}:`, err.message);
    }
  }

  if (insertados > 0) {
    await oracleConn.commit();

    // Actualizar SQL Server para el lote final restante
    if (batchMigrados.length > 0 && (claveControl || (campoTipoDocOrigen && campoNumDocOrigen))) {
      await marcarComoMigrados(
        sqlConn,
        proceso.tablaOrigen,
        campoTipoDocOrigen ? campoTipoDocOrigen.trim() : null,
        campoNumDocOrigen ? campoNumDocOrigen.trim() : null,
        campoFechaOrigen ? campoFechaOrigen.trim() : null,
        campoGlosaOrigen ? campoGlosaOrigen.trim() : null,
        claveControl,
        batchMigrados
      );
      batchMigrados = [];
    }

    // Actualizar progreso final
    await actualizarProceso(oracleConn, nombreProceso, `${insertados}/${filas.length}`);
  }

  console.log(`\n✅ Proceso "${proceso.nombre}" finalizado:`);
  console.log(`   Insertados : ${insertados}`);
  console.log(`   Errores    : ${errores}`);

  // Actualizar EGAP_PROCESOS - Fin del proceso
  await actualizarProceso(oracleConn, nombreProceso, `${insertados}/${filas.length}`);

  return { insertados, errores };
}

>>>>>>> c195d0aa8a889d50a50c8f7584d6506df29e01f5
module.exports = { migrar };