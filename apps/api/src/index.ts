import { PrismaClient } from "@prisma/client";
import { buildApp } from "./app.js";

const prisma = new PrismaClient();
const app = buildApp(prisma);

const PORT = parseInt(process.env.PORT || "3001", 10);
const HOST = process.env.HOST || "0.0.0.0";

async function start() {
  try {
    await app.listen({ port: PORT, host: HOST });
    console.log(`[API] Server berjalan di http://${HOST}:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
