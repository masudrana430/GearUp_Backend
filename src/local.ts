import app from "./app.js";
import { env } from "./config/env.js";

const server = app.listen(env.PORT, () => {
  console.log(
    `GearUp API running at http://localhost:${env.PORT}`,
  );
});

const shutdown = (signal: string): void => {
  console.log(`${signal} received. Closing server...`);

  server.close(() => {
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));