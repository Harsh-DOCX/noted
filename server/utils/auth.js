const crypto = require("crypto");
const { promisify } = require("util");

const scrypt = promisify(crypto.scrypt);
const TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

const getSecret = () => {
    if (!process.env.AUTH_TOKEN_SECRET) throw new Error("AUTH_TOKEN_SECRET must be set");
    return process.env.AUTH_TOKEN_SECRET;
};

const createHmac = (data) =>
    crypto.createHmac("sha256", getSecret()).update(data).digest();

const hashSecret = async (value) => {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = await scrypt(value, salt, 64);
    return `scrypt$${salt}$${hash.toString("hex")}`;
};

const verifySecret = async (value, storedHash = "") => {
    const [algo, salt, hash] = storedHash.split("$");
    if (algo !== "scrypt" || !salt || !hash) return false;

    const expected = Buffer.from(hash, "hex");
    const actual = await scrypt(value, salt, expected.length);
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
};

const signToken = (userId) => {
    const now = Math.floor(Date.now() / 1000);
    const payload = Buffer.from(JSON.stringify({ sub: userId, iat: now, exp: now + TOKEN_TTL })).toString("base64url");
    const signature = createHmac(payload).toString("base64url");
    return `${payload}.${signature}`;
};

const verifyToken = (token) => {
    const [payload, signature] = (token || "").split(".");
    if (!payload || !signature) throw new Error("Malformed token");

    const expected = createHmac(payload);
    const received = Buffer.from(signature, "base64url");
    if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
        throw new Error("Invalid token signature");
    }

    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof claims.sub !== "string" || claims.exp <= Math.floor(Date.now() / 1000)) {
        throw new Error("Invalid or expired token");
    }

    return claims.sub;
};

module.exports = { hashSecret, verifySecret, signToken, verifyToken };