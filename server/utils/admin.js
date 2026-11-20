const getAdminEmails = () => {
    const configuredEmails = process.env.ADMIN_EMAILS || process.env.admin_email || "";
    return configuredEmails.split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
};

const isAdmin = (user) => (
    typeof user?.email === "string"
    && typeof user.googleId === "string"
    && user.googleId.length > 0
    && getAdminEmails().includes(user.email.trim().toLowerCase())
);

module.exports = { isAdmin };
