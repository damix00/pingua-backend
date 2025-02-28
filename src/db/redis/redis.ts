import { createClient, RedisClientType } from "redis";
import config from "../../utils/config";

let redis: RedisClientType;

// 30 minutes
export const EXPIRY_TIME = config.get("NODE_ENV") == "production" ? 60 * 30 : 1;

export async function initRedis() {
    redis = createClient({
        url: config.get("REDIS_URL"),
    });

    redis.on("error", (error) => {
        console.error(error);
    });

    redis.on("connection", () => {
        console.log("Connected to Redis");
    });

    await redis.connect();
}

export { redis };
