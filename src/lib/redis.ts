import IORedis from "ioredis";

// Lee la URL de Redis desde las variables de entorno
const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL is not defined in your environment variables");
}

// Evita múltiples conexiones en entornos de desarrollo con hot-reloading
declare global {
  var redis: IORedis | undefined;
}

const redis = global.redis || new IORedis(redisUrl);

if (process.env.NODE_ENV !== "production") {
  global.redis = redis;
}

export default redis;
