import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { globalErrorHandler } from "./middlewares/globalErrorHandler.js";
import { notFound } from "./middlewares/notFound.js";
import { apiRouter } from "./routes/index.js";
// import swaggerUi from "swagger-ui-express";
import { swaggerDocument } from "./docs/swagger.js";



const app = express();

/*
 * Format all JSON responses with two-space indentation.
 * Useful for API demonstrations and assignment evaluation.
 */
app.set("json spaces", 2);

app.use(helmet());

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to GearUp API",
    data: {
      name: "GearUp",
      description: "Rent Sports & Outdoor Gear Instantly",
      version: "1.0.0",
    },
  });
});

app.use(express.json({ limit: "10mb" }));

app.use(
  express.urlencoded({
    extended: true,
  }),
);

app.use("/api/v1", apiRouter);


app.get("/api-docs.json", (_req, res) => {
  res.status(200).json(swaggerDocument);
});

app.get(["/api-docs", "/api-docs/"], (_req, res) => {
  /*
   * This route loads Swagger UI from unpkg.
   * The CSP is limited to this documentation response.
   */
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "style-src 'self' 'unsafe-inline' https://unpkg.com",
      "script-src 'self' 'unsafe-inline' https://unpkg.com",
      "img-src 'self' data: https:",
      "connect-src 'self'",
      "font-src 'self' data: https:",
    ].join("; "),
  );

  res.status(200).type("html").send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />

          <title>GearUp API Documentation</title>

          <link
            rel="stylesheet"
            href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css"
          />

          <style>
            html {
              box-sizing: border-box;
              overflow-y: scroll;
            }

            *,
            *::before,
            *::after {
              box-sizing: inherit;
            }

            body {
              margin: 0;
              background: #fafafa;
            }

            .swagger-ui .topbar {
              display: none;
            }
          </style>
        </head>

        <body>
          <div id="swagger-ui"></div>

          <script
            src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"
            crossorigin="anonymous"
          ></script>

          <script
            src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js"
            crossorigin="anonymous"
          ></script>

          <script>
            window.onload = function () {
              window.ui = SwaggerUIBundle({
                url: "/api-docs.json",
                dom_id: "#swagger-ui",

                presets: [
                  SwaggerUIBundle.presets.apis,
                  SwaggerUIStandalonePreset
                ],

                layout: "StandaloneLayout",
                deepLinking: true,
                persistAuthorization: true,
                displayRequestDuration: true,
                filter: true
              });
            };
          </script>
        </body>
      </html>
    `);
});

app.use(notFound);
app.use(globalErrorHandler);

export default app;
