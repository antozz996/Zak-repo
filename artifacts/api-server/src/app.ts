import { existsSync } from "node:fs";
import path from "node:path";
import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { createRateLimiter } from "./lib/rate-limit";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(
  express.json({
    verify(req, _res, buffer) {
      (req as express.Request & { rawBody?: Buffer }).rawBody = Buffer.from(buffer);
    },
  }),
);
app.use(express.urlencoded({ extended: true }));

app.use(
  "/api/webhook",
  createRateLimiter({
    limit: 60,
    windowMs: 60_000,
    keyPrefix: "webhook",
  }),
);

app.use(
  "/api",
  createRateLimiter({
    limit: 240,
    windowMs: 60_000,
    keyPrefix: "api",
    skip(req) {
      return req.path === "/healthz";
    },
  }),
);

app.use("/api", router);

const frontendDist = [
  path.resolve(process.cwd(), "../zak-app/dist/public"),
  path.resolve(process.cwd(), "artifacts/zak-app/dist/public"),
].find((candidate) => existsSync(path.join(candidate, "index.html")));

if (process.env["NODE_ENV"] === "production" && frontendDist) {
  const indexHtml = path.join(frontendDist, "index.html");
  app.use(express.static(frontendDist, { index: false }));
  app.get(/^\/(?!api(?:\/|$)).*/, (_req, res) => {
    res.sendFile(indexHtml);
  });
}

export default app;
