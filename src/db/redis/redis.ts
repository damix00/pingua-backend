import { createClient, RedisClientType } from "redis";
import config from "../../utils/config";

let redis: RedisClientType;

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
