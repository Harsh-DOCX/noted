const express = require("express");
const { OAuth2Client } = require("google-auth-library");
const User = require("../model/userSchema");
const requireAuth = require("../middleware/requireAuth");
const { hashSecret, verifySecret, signToken } = require("../utils/auth");

const router = express.Router();
const googleClient = new OAuth2Client();
const publicUser = (user) => ({
    id: user._id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
});

const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
const verifyGoogleCredential = (credential) => googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
});
const googleProfile = (ticket) => {
    const payload = ticket.getPayload();
    if (!payload || !payload.sub || !payload.email || payload.email_verified !== true) {
        return null;
    }
    return payload;
};

router.post("/", async (req, res) => {
    const body = req.body || {};
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = body.password;

    if (!email || !isNonEmptyString(password)) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    try {
        const user = await User.findOne({ email }).select("+password");
        if (!user || !(await verifySecret(password, user.password))) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        return res.status(200).json({
            message: "Login successful",
            token: signToken(user.id),
            user: publicUser(user),
        });
    } catch (error) {
        console.error("Login failed:", error);
        return res.status(500).json({ message: "Unable to log in" });
    }
});

router.post("/google", async (req, res) => {
    if (!process.env.GOOGLE_CLIENT_ID) {
        return res.status(503).json({ message: "Google sign-in is not configured" });
    }
    if (!isNonEmptyString(req.body?.credential)) {
        return res.status(400).json({ message: "A Google credential is required" });
    }

    let profile;
    try {
        profile = googleProfile(await verifyGoogleCredential(req.body.credential));
    } catch (error) {
        console.error("Google credential verification failed:", error);
        return res.status(401).json({ message: "Google sign-in could not be verified" });
    }
    if (!profile) {
        return res.status(401).json({ message: "Google account could not be verified" });
    }

    try {
        const user = await User.findOne({ googleId: profile.sub });
        if (!user) {
            const existingEmail = await User.exists({ email: profile.email.toLowerCase() });
            if (existingEmail) {
                return res.status(409).json({ message: "This email already has an account. Log in with your password." });
            }
            return res.status(404).json({ message: "Finish creating your account" });
        }

        return res.status(200).json({
            message: "Login successful",
            token: signToken(user.id),
            user: publicUser(user),
        });
    } catch (error) {
        console.error("Google login failed:", error);
        return res.status(500).json({ message: "Unable to log in with Google" });
    }
});

router.post("/google/new-user", async (req, res) => {
    if (!process.env.GOOGLE_CLIENT_ID) {
        return res.status(503).json({ message: "Google sign-in is not configured" });
    }
    const { credential, username, password, recoveryQuestion, recoveryAnswer } = req.body || {};
    if (
        ![credential, username, password, recoveryQuestion, recoveryAnswer].every(isNonEmptyString)
        || password.length < 8
    ) {
        return res.status(400).json({
            message: "Provide a Google credential, username, password of at least 8 characters, and recovery details",
        });
    }

    let profile;
    try {
        profile = googleProfile(await verifyGoogleCredential(credential));
    } catch (error) {
        console.error("Google credential verification failed:", error);
        return res.status(401).json({ message: "Google sign-up could not be verified" });
    }
    if (!profile) {
        return res.status(401).json({ message: "Google account could not be verified" });
    }

    try {
        const email = profile.email.toLowerCase();
        const existingUser = await User.findOne({
            $or: [{ googleId: profile.sub }, { email }],
        });
        if (existingUser) {
            return res.status(409).json({ message: "This Google account already has an account. Log in instead." });
        }

        const user = await User.create({
            username: username.trim(),
            fullName: isNonEmptyString(profile.name) ? profile.name.trim() : username.trim(),
            email,
            googleId: profile.sub,
            password: await hashSecret(password),
            recoveryQuestion: recoveryQuestion.trim(),
            recoveryAnswer: await hashSecret(recoveryAnswer.trim().toLowerCase()),
        });
        return res.status(201).json({
            message: "User created successfully",
            token: signToken(user.id),
            user: publicUser(user),
        });
    } catch (error) {
        if (error.code === 11000) {
            const duplicateField = Object.keys(error.keyPattern || {})[0];
            return res.status(409).json({
                message: duplicateField === "username"
                    ? "Username is already taken"
                    : "This Google account already has an account",
            });
        }
        if (error.name === "ValidationError") {
            return res.status(400).json({ message: "User details are invalid" });
        }

        console.error("Google registration failed:", error);
        return res.status(500).json({ message: "Unable to create a Google account" });
    }
});

router.post("/new-user", async (req, res) => {
    const { username, fullName, email, password, recoveryQuestion, recoveryAnswer } = req.body || {};

    if (
        ![username, fullName, email, password, recoveryQuestion, recoveryAnswer]
            .every(isNonEmptyString)
        || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
        || password.length < 8
    ) {
        return res.status(400).json({
            message: "Provide all fields, a valid email, and a password of at least 8 characters",
        });
    }

    try {
        const user = await User.create({
            username: username.trim(),
            fullName: fullName.trim(),
            email: email.trim().toLowerCase(),
            password: await hashSecret(password),
            recoveryQuestion: recoveryQuestion.trim(),
            recoveryAnswer: await hashSecret(recoveryAnswer.trim().toLowerCase()),
        });

        return res.status(201).json({
            message: "User created successfully",
            token: signToken(user.id),
            user: publicUser(user),
        });
    } catch (error) {
        if (error.code === 11000) {
            const duplicateField = Object.keys(error.keyPattern || {})[0];
            return res.status(409).json({
                message: duplicateField === "username"
                    ? "Username is already taken"
                    : "Email is already registered",
            });
        }
        if (error.name === "ValidationError") {
            return res.status(400).json({ message: "User details are invalid" });
        }

        console.error("User registration failed:", error);
        return res.status(500).json({ message: "Unable to create user" });
    }
});

router.get("/me", requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json({ user: publicUser(user) });
    } catch (error) {
        console.error("Unable to fetch profile:", error);
        return res.status(500).json({ message: "Unable to fetch profile" });
    }
});

module.exports = router;
