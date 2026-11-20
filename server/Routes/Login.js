const express = require("express");
const { OAuth2Client } = require("google-auth-library");
const User = require("../model/userSchema");
const requireAuth = require("../middleware/requireAuth");
const { hashSecret, verifySecret, signToken } = require("../utils/auth");
const { isAdmin } = require("../utils/admin");

const router = express.Router();
const googleClient = new OAuth2Client();

// --- Helpers ---

// Checks that all passed fields are non-empty strings
const hasFields = (...fields) => fields.every((f) => typeof f === "string" && f.trim().length > 0);

const sendAuth = (res, user, message = "Login successful", status = 200) =>
    res.status(status).json({
        message,
        token: signToken(user.id),
        user: { id: user._id, username: user.username, fullName: user.fullName, email: user.email, isAdmin: isAdmin(user) },
    });

const verifyGoogle = async (req, res) => {
    const { credential } = req.body || {};
    if (!hasFields(credential)) {
        res.status(400).json({ message: "Google credential is required" });
        return null;
    }
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload?.sub || !payload.email_verified) throw new Error();
        return payload;
    } catch {
        res.status(401).json({ message: "Google sign-in could not be verified" });
        return null;
    }
};

const createUser = async ({ username, fullName, email, password, recoveryQuestion, recoveryAnswer, googleId }) =>
    User.create({
        username: username.trim(),
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        googleId,
        password: await hashSecret(password),
        recoveryQuestion: recoveryQuestion.trim(),
        recoveryAnswer: await hashSecret(recoveryAnswer.trim().toLowerCase()),
    });


router.post("/", async (req, res) => {
    const { email, password } = req.body || {};
    if (!hasFields(email, password)) return res.status(400).json({ message: "Email and password are required" });

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+password");
    if (!user || !(await verifySecret(password, user.password))) {
        return res.status(401).json({ message: "Invalid email or password" });
    }
    return sendAuth(res, user);
});

router.post("/new-user", async (req, res) => {
    const { username, fullName, email, password, recoveryQuestion, recoveryAnswer } = req.body || {};
    if (!hasFields(username, fullName, email, password, recoveryQuestion, recoveryAnswer) || password.length < 8) {
        return res.status(400).json({ message: "All fields are required and password must be 8+ characters" });
    }

    try {
        const user = await createUser({ username, fullName, email, password, recoveryQuestion, recoveryAnswer });
        return sendAuth(res, user, "User created successfully", 201);
    } catch (err) {
        return res.status(err.code === 11000 ? 409 : 500).json({
            message: err.code === 11000 ? "Username or email already exists" : "Unable to create user",
        });
    }
});

router.post("/google", async (req, res) => {
    const profile = await verifyGoogle(req, res);
    if (!profile) return;

    const user = await User.findOne({ googleId: profile.sub });
    if (user) return sendAuth(res, user);

    const emailExists = await User.exists({ email: profile.email.toLowerCase() });
    return res.status(emailExists ? 409 : 404).json({
        message: emailExists ? "Email already has an account. Log in with password." : "Finish creating your account",
    });
});

router.post("/google/link", async (req, res) => {
    const profile = await verifyGoogle(req, res);
    if (!profile) return;

    const { password } = req.body || {};
    if (!hasFields(password)) return res.status(400).json({ message: "Password is required" });

    const user = await User.findOne({ email: profile.email.toLowerCase() }).select("+password");
    if (!user || !(await verifySecret(password, user.password))) {
        return res.status(401).json({ message: "Invalid email or password" });
    }
    if (user.googleId || (await User.exists({ googleId: profile.sub }))) {
        return res.status(409).json({ message: "Account is already linked" });
    }

    user.googleId = profile.sub;
    await user.save();
    return sendAuth(res, user, "Google account linked successfully");
});

router.post("/google/new-user", async (req, res) => {
    const profile = await verifyGoogle(req, res);
    if (!profile) return;

    const { username, password, recoveryQuestion, recoveryAnswer } = req.body || {};
    if (!hasFields(username, password, recoveryQuestion, recoveryAnswer) || password.length < 8) {
        return res.status(400).json({ message: "All fields are required and password must be 8+ characters" });
    }

    try {
        const user = await createUser({
            username,
            fullName: profile.name || username,
            email: profile.email,
            password,
            recoveryQuestion,
            recoveryAnswer,
            googleId: profile.sub,
        });
        return sendAuth(res, user, "User created successfully", 201);
    } catch (err) {
        return res.status(err.code === 11000 ? 409 : 500).json({
            message: err.code === 11000 ? "Account or username already exists" : "Unable to create Google account",
        });
    }
});

router.get("/me", requireAuth, async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    return sendAuth(res, user);
});

module.exports = router;