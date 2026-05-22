require("dotenv").config();
const { parseJsonPayload, runProcess } = require("./jsonRunner");

function isJsonString(value) {
  return typeof value === "string" && value.trim().startsWith("{");
}

function printUsage() {
  console.error("? Uso:");
  console.error("   node src/index.js NS [limite] [J]");
  console.error("   node src/index.js NS J");
  console.error("   node src/index.js --json '{\"proceso\":\"MC\",\"cantidad\":100,\"j\":\"J\"}'");
  console.error("   node src/index.js '{\"proceso\":\"NC\",\"cantidad\":0,\"j\":false}'");
}

async function main() {
  const [arg1, arg2, arg3] = process.argv.slice(2);
  let payload;

  if (!arg1) {
    printUsage();
    process.exit(1);
  }

  if (arg1 === "--json" || arg1 === "-j") {
    if (!arg2) {
      console.error("? Debes pasar el JSON después de --json.");
      process.exit(1);
    }
    payload = parseJsonPayload(arg2);
  } else if (isJsonString(arg1)) {
    payload = parseJsonPayload(arg1);
  } else {
    const proceso = arg1.toUpperCase();
    let limite = 0;
    let ejecutarJob = false;

    if (arg2) {
      if (arg2.toUpperCase() === "J") {
        ejecutarJob = true;
      } else {
        limite = parseInt(arg2, 10) || 0;
      }
    }

    if (arg3?.toUpperCase() === "J") {
      ejecutarJob = true;
    }

    payload = { proceso, limite, ejecutarJob };
  }

  try {
    await runProcess(payload);
  } catch (err) {
    process.exit(1);
  }
}

main();
