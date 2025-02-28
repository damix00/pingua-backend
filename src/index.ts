import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import cluster from "cluster";
import os from "os";
import fileUpload from "express-fileupload";
import { createServer } from "http";
import logger from "./middleware/logger";
import userAgent from "./middleware/user-agent";
import { routes } from "./routes/exports";
import * as resend from "./apis/resend/resend";
import * as db from "./db/prisma";
import config from "./utils/config";
import { initRedis } from "./db/redis/redis";
import parser from "body-parser";
import * as stripe from "./apis/stripe/stripe";

// Load environment variables
config.init();

const app = express();
const server = createServer(app);

const PORT = config.get("PORT") || 9500;

// Initialize Resend API
resend.init();

// Initialize Stripe API
stripe.init();

app.use("/v1/subscriptions/webhook", express.raw({ type: "application/json" }));

app.use(parser.json({ limit: "200mb" }));
app.use(parser.urlencoded({ limit: "200mb", extended: true }));
app.use(parser.raw({ limit: "200mb" }));

// File upload handler
app.use(
    fileUpload({
        useTempFiles: true,
        // The OS temp directory
        // for example, on windows %TEMP% (C:\Users\Username\AppData\Local\Temp)
        // on linux /tmp
        tempFileDir: os.tmpdir(),
        limits: {
            fileSize: 1024 * 1024 * 100, // 100MB
        },
    })
);
app.use(
    cors({
        origin: "*",
    })
);
app.use(logger); // Log all requests
app.use(express.json()); // JSON parser
app.disable("etag"); // Disable 304 responses
app.use(userAgent); // add user agent to request
app.enable("trust proxy");

for (const route of routes) {
    app.use(route.basePath, route.router);
}

app.all("*", (req, res) => {
    res.status(404).json({
        message: "Not Found",
    });
});

async function start() {
    await initRedis();
    // Initialize Prisma
    await db.initPrisma();

    server.listen(PORT, () => {
        console.log(`Server is running in http://localhost:${PORT}`);
    });
}

if (cluster.isMaster) {
    for (
        let i = 0;
        i < (config.get("NODE_ENV") == "production" ? os.cpus().length : 1);
        i++
    ) {
        cluster.fork();
    }
} else {
    start();
}
