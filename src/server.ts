import app from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";

let server: ReturnType<typeof app.listen>;

const startServer = async (): Promise<void> => {
  try {
    await prisma.$connect();

    console.log("Database connected successfully");

    server = app.listen(env.PORT, () => {
      console.log(`GearUp API running on http://localhost:${env.PORT}`);
      console.log(
        `Health check: http://localhost:${env.PORT}/api/v1/health`,
      );
    });
  } catch (error) {
    console.error("Failed to start GearUp API:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

const gracefulShutdown = async (signal: string): Promise<void> => {
  console.log(`${signal} received. Shutting down gracefully...`);

  if (server) {
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  } else {
    await prisma.$disconnect();
    process.exit(0);
  }
};

process.on("SIGTERM", () => {
  void gracefulShutdown("SIGTERM");
});

process.on("SIGINT", () => {
  void gracefulShutdown("SIGINT");
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
  void gracefulShutdown("UNHANDLED_REJECTION");
});

void startServer();