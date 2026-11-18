require("dotenv").config();
const { parseJsonPayload, runProcess } = require("./jsonRunner");

function isJsonString(value) {
  return typeof value === "string" && value.trim().startsWith("{");
}

function printUsage() {
  console.error("? Uso:");
  console.error("   node src/index.js NS [limite] [J] [periodo]");
  console.error("   node src/index.js NS J [periodo]");
  console.error("   node src/index.js --json '{\"proceso\":\"MC\",\"cantidad\":100,\"j\":\"J\",\"periodo\":\"202405\"}'");
  console.error("   node src/index.js '{\"proceso\":\"NC\",\"cantidad\":0,\"j\":false,\"periodo\":\"202405\"}'");
}

async function main() {
  const args = process.argv.slice(2);
  const [arg1, arg2, arg3, arg4] = args;
  let payload;

  if (!arg1) {
    printUsage();
    process.exit(1);
  }

  if (arg1 === "--json" || arg1 === "-j") {
    if (!arg2) {
      console.error("? Debes pasar el JSON despu�s de --json.");
      process.exit(1);
    }
    payload = parseJsonPayload(arg2);
  } else if (isJsonString(arg1)) {
    payload = parseJsonPayload(arg1);
  } else {
    const proceso = arg1.toUpperCase();
    let limite = 0;
    let ejecutarJob = false;
    let periodo = null;

    if (arg2) {
      if (arg2.toUpperCase() === "J") {
        ejecutarJob = true;
      } else if (/^\d+$/.test(arg2)) {
        limite = parseInt(arg2, 10);
      } else {
        periodo = arg2;
      }
    }

    if (arg3) {
      if (arg3.toUpperCase() === "J") {
        ejecutarJob = true;
      } else if (!periodo) {
        periodo = arg3;
      }
    }

    if (arg4) periodo = arg4;

    payload = { proceso, limite, ejecutarJob, periodo };
  }

  try {
    await runProcess(payload);
  } catch (err) {
    process.exit(1);
  }
}

main();
