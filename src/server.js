require("dotenv").config();
const express = require("express");
const { parseJsonPayload, runProcess, runObtenerFechas, runProcessMes } = require("./jsonRunner");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Servicio activo" });
});

app.get("/fechas/:proceso", async (req, res) => {
  try {
    const { proceso } = req.params;
    const fechas = await runObtenerFechas(proceso);
    res.json({ codigo: "0", mensaje: "Fechas obtenidas exitosamente", fechas });
  } catch (err) {
    res.status(400).json({ codigo: "1", mensaje: err.message, error: err.message });
  }
});

app.post("/run", async (req, res) => {
  try {
    const payload = parseJsonPayload(req.body);
    const result = await runProcess(payload);
    res.json({ codigo: "0", mensaje: "Proceso iniciado", details: result });
  } catch (err) {
    res.status(400).json({ codigo: "1", mensaje: err.message, error: err.message });
  }
});

app.post("/run-mes", async (req, res) => {
  try {
    const { proceso, mes, anio, ejecutarJob, limite } = req.body;
    if (!proceso || !mes || !anio) {
      return res.status(400).json({ codigo: "1", mensaje: "Debe proporcionar proceso, mes y anio en el cuerpo de la petición." });
    }
    const result = await runProcessMes({ proceso, mes, anio, ejecutarJob, limite });
    res.json({ codigo: "0", mensaje: "Migración mensual completada", details: result });
  } catch (err) {
    res.status(500).json({ codigo: "1", mensaje: err.message, error: err.message });
  }
});

const server = app.listen(PORT, () => {
  console.log(`🚀 API escuchando en http://localhost:${PORT}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ El puerto ${PORT} ya está ocupado.`);
    console.error("   Usa otra variable PORT antes de ejecutar: ");
    console.error("     PowerShell: $env:PORT=3001; npm run serve");
    console.error("     CMD: set PORT=3001&& npm run serve");
    process.exit(1);
  }
  console.error("❌ Error al iniciar el servidor:", err.message);
  process.exit(1);
});
