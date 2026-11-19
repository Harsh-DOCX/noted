const { verifyToken } = require("../utils/auth");

const requireAuth = (req, res, next) => {
    const authorization = req.get("authorization");
    const match = authorization && authorization.match(/^Bearer\s+(.+)$/i);

    if (!match) {
        return res.status(401).json({ message: "Authentication required" });
    }

    try {
        req.userId = verifyToken(match[1]);
        return next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

module.exports = requireAuth;
