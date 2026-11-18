require('dotenv').config();
const sql = require('mssql');
const sqlConfig = require('../config/sqlserver');

const tablas = [
  'SUB_HISNSNEG',
  'HISNCNEG',
  'HISMCNEG',
  'SUB_HISMSNEG',
  'HISR3',
  'SUB_HISS3'
];

async function main() {
  console.log('🔌 Conectando a SQL Server para inicializar estructura...');
  let pool = null;
  try {
    pool = await sql.connect(sqlConfig);
    
    for (const tabla of tablas) {
      console.log(`\nChecking column MIGRADO in table: ${tabla}...`);
      
      const query = `
        IF NOT EXISTS (
            SELECT * FROM sys.columns 
            WHERE object_id = OBJECT_ID('dbo.${tabla}') AND name = 'MIGRADO'
        )
        BEGIN
            ALTER TABLE dbo.${tabla} ADD MIGRADO VARCHAR(1) NULL;
            PRINT 'Columna MIGRADO agregada exitosamente';
        END
        ELSE
        BEGIN
            PRINT 'La columna MIGRADO ya existe';
        END
      `;
      
      const request = pool.request();
      const result = await request.query(query);
      console.log(`   ✅ Procesado ${tabla}`);
    }
    
    console.log('\n🎉 Estructura de base de datos actualizada exitosamente.');
  } catch (err) {
    console.error('❌ Error alterando estructura de base de datos:', err.message || err);
  } finally {
    if (pool) {
      await pool.close();
      console.log('🔌 Conexión cerrada.');
    }
  }
}

main();
