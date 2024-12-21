import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import cluster from "cluster";
import os from "os";
import fileUpload from "express-fileupload";
import { createServer } from "http";
import logger from "./middleware/logger";
import initFirebase from "./firebase/config";
import userAgent from "./middleware/user-agent";
import { routes } from "./routes/exports";

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);

const PORT = process.env.PORT || 9500;

// Initialize Firebase
initFirebase();

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
    app.use(route.path, [
        (req: Request, res: Response, next: NextFunction) => {
            if (route.method == "all") next();
            else if (route.method == req.method.toLowerCase()) next();
            else
                res.status(405).json({
                    message: "Method Not Allowed",
                });
        },
        ...(Array.isArray(route.handler) ? route.handler : [route.handler]),
    ]);
}

app.all("*", (req, res) => {
    res.status(404).json({
        message: "Not Found",
    });
});

async function start() {
    console.log("Connecting to database");
    // await connection.connect();
    console.log("Connected to database");

    server.listen(PORT, () => {
        console.log(`Server is running in http://localhost:${PORT}`);
    });
}

if (cluster.isMaster) {
    for (
        let i = 0;
        i <
        (process.env?.PRODUCTION_MODE?.toString() == "true"
            ? os.cpus().length
            : 1);
        i++
    ) {
        cluster.fork();
    }
} else {
    start();
}
