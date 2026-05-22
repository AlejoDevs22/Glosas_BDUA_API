require("dotenv").config();
const express = require("express");
const { parseJsonPayload, runProcess } = require("./jsonRunner");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Servicio activo" });
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
