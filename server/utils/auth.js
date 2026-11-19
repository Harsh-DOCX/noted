const crypto = require("crypto");
const { promisify } = require("util");

const scrypt = promisify(crypto.scrypt);
const TOKEN_LIFETIME_SECONDS = 7 * 24 * 60 * 60;

const hashSecret = async (value) => {
    const salt = crypto.randomBytes(16).toString("hex");
    const derivedKey = await scrypt(value, salt, 64);
    return `scrypt$${salt}$${derivedKey.toString("hex")}`;
};

const verifySecret = async (value, storedHash) => {
    const [algorithm, salt, hash] = (storedHash || "").split("$");
    if (algorithm !== "scrypt" || !salt || !hash) {
        return false;
    }

    const expected = Buffer.from(hash, "hex");
    const actual = await scrypt(value, salt, expected.length);
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
};

const signToken = (userId) => {
    const secret = process.env.AUTH_TOKEN_SECRET;
    if (!secret) {
        throw new Error("AUTH_TOKEN_SECRET must be set");
    }

    const now = Math.floor(Date.now() / 1000);
    const payload = Buffer.from(JSON.stringify({
        sub: userId,
        iat: now,
        exp: now + TOKEN_LIFETIME_SECONDS,
    })).toString("base64url");
    const signature = crypto
        .createHmac("sha256", secret)
        .update(payload)
        .digest("base64url");

    return `${payload}.${signature}`;
};

const verifyToken = (token) => {
    const secret = process.env.AUTH_TOKEN_SECRET;
    if (!secret) {
        throw new Error("AUTH_TOKEN_SECRET must be set");
    }

    const parts = token.split(".");
    if (parts.length !== 2) {
        throw new Error("Malformed token");
    }

    const [payload, signature] = parts;
    const expected = crypto.createHmac("sha256", secret).update(payload).digest();
    let received;
    try {
        received = Buffer.from(signature, "base64url");
    } catch (error) {
        throw new Error("Malformed token");
    }
    if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
        throw new Error("Invalid token signature");
    }

    let claims;
    try {
        claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    } catch (error) {
        throw new Error("Malformed token payload");
    }
    if (
        typeof claims.sub !== "string"
        || !Number.isInteger(claims.exp)
        || claims.exp <= Math.floor(Date.now() / 1000)
    ) {
        throw new Error("Invalid or expired token");
    }

    return claims.sub;
};

module.exports = { hashSecret, verifySecret, signToken, verifyToken };
