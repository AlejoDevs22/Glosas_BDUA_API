const ftp = require('basic-ftp');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const sql = require('mssql');
const { Pool } = require('pg');
const sqlConfig = require('./config/sqlserver'); // Assuming this exists from original project


// Configuración PostgreSQL para auditoría
const pgPool = new Pool({
    user: process.env.PG_USER || 'postgres',
    host: process.env.PG_HOST || 'localhost',
    database: process.env.PG_DATABASE || 'auditoria_db',
    password: process.env.PG_PASSWORD || '212230',
    port: process.env.PG_PORT || 5432,
});

const FTP_HOST = "192.168.50.10";
const FTP_USER = "ftp_aseguramiento";
const FTP_PASS = "Control2021!";
const FTP_DIR = "/Contributivo/";

function quote(val) {
    if (val === undefined || val === null) return "''";
    return `'${String(val).replace(/'/g, "''")}'`;
}

// Función para mapear un archivo a su consulta SQL de inserción
function buildQuery(filename, line) {
    const filenameUpper = filename.toUpperCase();
    const ext = filenameUpper.split('.').pop();
    let values = line.split(',');
    
    // R1
    if (filenameUpper.startsWith('R1CCFC55')) {
        if (ext === 'EST') {
            values.push(filename);
            return `EXEC Hrsp_carguearchivosR1Est ${values.map(quote).join(',')}`;
        }
        values.push(filename);
        return `EXEC Hrsp_carguearchivosR1 ${values.map(quote).join(',')}`;
    }
    // MC
    if (filenameUpper.startsWith('MCCCFC55') || filenameUpper.startsWith('MCMSPS01')) {
        if (ext === 'EST' || ext === 'NEG') {
            const rpta = ext === 'EST' ? 'MCEST' : 'MCNEG';
            values.push(rpta, filename);
            return `EXEC Hmcsp_carguearchivosMCEst ${values.map(quote).join(',')}`;
        }
        values.push(filename);
        return `EXEC Hmcsp_carguearchivosMC ${values.map(quote).join(',')}`;
    }
    // NC
    if (filenameUpper.startsWith('NCCCFC55') || filenameUpper.startsWith('NCMSPS01')) {
        if (ext === 'EST' || ext === 'NEG') {
            const rpta = ext === 'EST' ? 'NCEST' : 'NCNEG';
            values.push(rpta, filename);
            return `EXEC Hncsp_carguearchivosNCEst ${values.map(quote).join(',')}`;
        }
        return `EXEC Hncsp_carguearchivosNC ${values.map(quote).join(',')}`;
    }
    // MA
    if (filenameUpper.startsWith('MACCFC55') || filenameUpper.startsWith('MAMSPS01')) {
        if (ext === 'EST' || ext === 'NEG') {
            const rpta = ext === 'EST' ? 'MAEST' : 'MANEG';
            values.push(rpta, filename);
            return `EXEC Hmasp_carguearchivosMAEst ${values.map(quote).join(',')}`;
        }
        values.push(filename);
        return `EXEC Hmasp_carguearchivosMA ${values.map(quote).join(',')}`;
    }
    // S4CON
    if (filenameUpper.startsWith('S4CCFC55')) {
        values.push(filename);
        return `EXEC Hrsp_carguearchivosS4CON ${values.map(quote).join(',')}`;
    }
    // S2CON
    if (filenameUpper.startsWith('S2CCFC55')) {
        values.push(filename);
        return `EXEC Hrsp_carguearchivosS2CON ${values.map(quote).join(',')}`;
    }
    // R4
    if (filenameUpper.startsWith('R4CCFC55')) {
        return `EXEC Hrsp_carguearchivosR4 ${values.map(quote).join(',')}`;
    }
    // R2
    if (filenameUpper.startsWith('R2CCFC55')) {
        values.push(filename);
        return `EXEC Hrsp_carguearchivosR2 ${values.map(quote).join(',')}`;
    }
    // R3
    if (filenameUpper.startsWith('R3CCFC55')) {
        return `EXEC Hrsp_carguearchivosR3 ${values.map(quote).join(',')}`;
    }
    // R5
    if (filenameUpper.startsWith('R5CCFC55')) {
        return `EXEC Hrsp_carguearchivosR5 ${values.map(quote).join(',')}`;
    }
    // R6
    if (filenameUpper.startsWith('R6CCFC55')) {
        return `EXEC Hrsp_carguearchivosR6 ${values.map(quote).join(',')}`;
    }
    // AUT R1
    if (filenameUpper.startsWith('AUTOMATICOS-R1') || filenameUpper.startsWith('AUTOMATICOS-R1MSPS01')) {
        return `EXEC Hrsp_carguearchivosR1Aut ${values.map(quote).join(',')}`;
    }
    // AUT R2
    if (filenameUpper.startsWith('AUTOMATICOS-R2') || filenameUpper.startsWith('R2SATCCFC55')) {
        return `EXEC Hrsp_carguearchivosR2Aut ${values.map(quote).join(',')}`;
    }
    // AUT S2
    if (filenameUpper.startsWith('AUTOMATICOS-S2') || filenameUpper.startsWith('S2SATCCFC55')) {
        return `EXEC Hrsp_carguearchivosS2AutCon ${values.map(quote).join(',')}`;
    }
    
    return null;
}

async function registerAudit(filename, status, rowsProcessed, errorMessage = null) {
    try {
        const query = `
            CREATE TABLE IF NOT EXISTS auditoria_bdua_ftp (
                id SERIAL PRIMARY KEY,
                filename VARCHAR(255),
                status VARCHAR(50),
                rows_processed INT,
                error_message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            INSERT INTO auditoria_bdua_ftp (filename, status, rows_processed, error_message)
            VALUES ($1, $2, $3, $4);
        `;
        await pgPool.query(query, [filename, status, rowsProcessed, errorMessage]);
        console.log(`Auditoría registrada para ${filename}: ${status}`);
    } catch (e) {
        console.error("Error guardando en auditoría PG:", e.message);
    }
}

async function processFtpFiles() {
    const client = new ftp.Client();
    client.ftp.verbose = false;
    let sqlPool;

    try {
        sqlPool = await sql.connect(sqlConfig);
        await client.access({
            host: FTP_HOST,
            user: FTP_USER,
            password: FTP_PASS,
            secure: false
        });

        console.log("Conectado a FTP. Listando archivos en", FTP_DIR);
        await client.cd(FTP_DIR);
        const list = await client.list();
        
        const tmpDir = path.join(__dirname, '..', 'tmp');
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir);
        }

        for (const file of list) {
            if (file.type === 1) { // 1 = file
                const queryToTest = buildQuery(file.name, "");
                if (queryToTest) {
                    console.log(`Procesando archivo: ${file.name}`);
                    const localPath = path.join(tmpDir, file.name);
                    
                    try {
                        await client.downloadTo(localPath, file.name);
                        
                        let rowsProcessed = 0;
                        const fileStream = fs.createReadStream(localPath);
                        const rl = readline.createInterface({
                            input: fileStream,
                            crlfDelay: Infinity
                        });
                        
                        for await (const line of rl) {
                            if (line.trim() !== '') {
                                const query = buildQuery(file.name, line);
                                if (query) {
                                    await sqlPool.request().query(query);
                                    rowsProcessed++;
                                }
                            }
                        }
                        
                        // Registro de éxito
                        await registerAudit(file.name, 'COMPLETADO', rowsProcessed);
                        
                    } catch (err) {
                        console.error(`Error procesando archivo ${file.name}:`, err);
                        await registerAudit(file.name, 'ERROR', 0, err.message);
                    } finally {
                        if (fs.existsSync(localPath)) {
                            fs.unlinkSync(localPath);
                        }
                    }
                }
            }
        }
    } catch (err) {
        console.error("Error global en FTP Runner:", err);
    } finally {
        client.close();
        if (sqlPool) {
            sqlPool.close();
        }
    }
}

module.exports = {
    processFtpFiles
};
