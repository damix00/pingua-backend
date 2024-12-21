import { NextFunction, Request, Response } from "express";

// Winston is a logger library
import { createLogger, format, transports } from "winston";
// Colors is a library for adding colors to console output
import colors from "colors";

// Create a logger object
const logger = createLogger({
    transports: [
        // Add a console logger
        new transports.Console({
            // Format the output to include the timestamp and the message
            format: format.combine(
                format.timestamp({ format: "DD.MM.YYYY HH:mm:ss" }),
                format.printf(
                    (info) =>
                        `${colors.green(`[${info.timestamp}]`)} ${info.message}`
                )
            ),
        }),
    ],
});

// This middleware function will be called before any request
export default (req: Request, res: Response, next: NextFunction) => {
    // Store the time the request started
    const start = Date.now();

    // When the response is finished...
    res.on("finish", () => {
        // Log the request
        logger.info(
            `${req.ip} - ${colors.yellow(req.method)} ${req.baseUrl}${
                req.path
            } ${res.statusCode} - ${colors.blue(`${Date.now() - start}ms`)}`
        );
    });

    // Move on to the next middleware function or route handler
    next();
};
