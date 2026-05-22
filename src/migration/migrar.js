// src/migration/migrar.js
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
  
  // UPDATE EGAP_PROCESOS s SET s.egac_progreso = v_progreso WHERE s.egac_proceso = v_proceso
  const sqlUpdate = `UPDATE EGAP_PROCESOS s 
                     SET s.egac_progreso = :1
                     WHERE s.egac_proceso = :2`;
  
  try {
    const result = await oracleConn.execute(sqlUpdate, [progresoValor, nombreProceso], { autoCommit: true });
    console.log(`   📊 EGAP_PROCESOS actualizada - Filas: ${result.rowsAffected}, Progreso: ${progresoValor}`);
  } catch (err) {
    console.error(`   ⚠️  Error actualizando EGAP_PROCESOS:`, err.message);
  }
}

async function migrar(nombreProceso, sqlConn, oracleConn, limite = 0) {
  const proceso = procesos[nombreProceso];

  if (!proceso) {
    throw new Error(`Proceso "${nombreProceso}" no encontrado en procesos.js`);
  }

  console.log(`\n🚀 Iniciando proceso: ${proceso.nombre}`);
  console.log(`   Origen  → ${proceso.tablaOrigen}`);
  console.log(`   Destino → ${proceso.tablaDestino}`);
  console.log(`   Límite  → ${limite === 0 ? 'sin límite' : limite} registros`);

  // Actualizar EGAP_PROCESOS - Inicio del proceso
  await actualizarProceso(oracleConn, nombreProceso, 0);

  // 1. Si existe filtro, obtener códigos válidos de Oracle
  let codigosValidos = null;
  if (proceso.filtro) {
    const limiteMsg = limite > 0 ? `(límite: ${limite})` : '';
    console.log(`\n🔍 Obteniendo códigos de glosa válidos desde Oracle ${limiteMsg}...`);
    try {
      let consultaValidacion = proceso.filtro.consultaValidacion;
      // Aplicar límite si se especifica (0 = sin límite)
      // Usar subconsulta para aplicar el límite DESPUÉS del WHERE existente
      if (limite > 0) {
        consultaValidacion = "SELECT * FROM (" + consultaValidacion + ") WHERE ROWNUM <= " + limite;
      }
      const resultadoOracle = await oracleConn.execute(consultaValidacion);
      codigosValidos = new Set(resultadoOracle.rows.map(row => row[0]));
      console.log(`   ${codigosValidos.size} códigos de glosa encontrados`);
    } catch (err) {
      console.error(`   ❌ Error obteniendo códigos de validación:`, err.message);
      return { insertados: 0, omitidos: 0, errores: 0 };
    }
  }

  // 2. Leer datos desde SQL Server
  const camposOrigen = proceso.campos
    .filter(c => c.origen)
    .map(c => c.origen)
    .join(", ");
  let query = `SELECT ${camposOrigen} 
               FROM ${proceso.tablaOrigen}`;
  
  // Aplicar límite en SQL Server si se especifica (0 = sin límite)
  if (limite > 0) {
    query = `SELECT TOP ${limite} ${camposOrigen} 
             FROM ${proceso.tablaOrigen}`;
  }
  
  console.log(`\n📥 Leyendo datos de SQL Server...`);

  const resultado = await sqlConn.request().query(query);
  let filas = resultado.recordset;
  console.log(`   ${filas.length} registros encontrados`);

  // Aplicar filtro si existe
  if (codigosValidos !== null && proceso.filtro) {
    const filasAntes = filas.length;
    filas = filas.filter(fila => {
      const prefijo = String(fila[proceso.filtro.campoOrigen] || "").substring(0, proceso.filtro.longitudPrefijo);
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
  let errores    = 0;

  const camposDestino = proceso.campos.map(c => c.destino);
  const bindKeys      = proceso.campos.map((_, i) => `:${i + 1}`);

  const sqlInsert = `INSERT INTO ${proceso.tablaDestino} (${camposDestino.join(", ")})
                     VALUES (${bindKeys.join(", ")})`;

  const COMMIT_BATCH = 100;
  console.log(`\n📤 Insertando en Oracle...`);

  for (let index = 0; index < filas.length; index++) {
    const fila = filas[index];

    try {
      const valores = proceso.campos.map(c =>
        c.hasOwnProperty("valor") ? c.valor : fila[c.origen] ?? null
      );
      await oracleConn.execute(sqlInsert, valores, { autoCommit: false });
      insertados++;

      if ((index + 1) % COMMIT_BATCH === 0) {
        await oracleConn.commit();
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

module.exports = { migrar };