// Read routes from ./routes and laod them

import express from "express";
import path from "path";
import fs from "fs";

type Method =
    | "get"
    | "post"
    | "put"
    | "delete"
    | "patch"
    | "options"
    | "connect"
    | "trace";

const routes: {
    path: string;
    handler: any;
    method: Method | "all";
}[] = [];

function loadRoutes(dir: string, prefix = "") {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.lstatSync(fullPath);

        if (stat.isDirectory()) {
            loadRoutes(fullPath, path.join(prefix, file));
        } else {
            if (file.endsWith(".js") && file !== "exports.js") {
                const route = require(fullPath);

                const handlerPath =
                    file === "index.js"
                        ? prefix
                        : path.join(prefix, file.replace(".js", ""));

                if (route.default) {
                    routes.push({
                        path: handlerPath,
                        handler: route.default,
                        method: "all",
                    });
                }

                const methods = Object.keys(route).filter(
                    (method) => method !== "default"
                );

                for (const method of methods) {
                    routes.push({
                        path: handlerPath,
                        handler: route[method],
                        method: method.toLocaleLowerCase() as Method,
                    });
                }
            }
        }
    }
}

loadRoutes(__dirname);

export default routes;
