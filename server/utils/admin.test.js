const { test } = require("node:test");
const assert = require("node:assert/strict");
const { isAdmin } = require("./admin");

const admin = { email: "Admin@example.test", googleId: "google-account-id" };

function withAdminEmails({ uppercase, lowercase }, callback) {
    const previousUppercase = process.env.ADMIN_EMAILS;
    const previousLowercase = process.env.admin_email;
    if (uppercase === undefined) delete process.env.ADMIN_EMAILS;
    else process.env.ADMIN_EMAILS = uppercase;
    if (lowercase === undefined) delete process.env.admin_email;
    else process.env.admin_email = lowercase;

    try {
        callback();
    } finally {
        if (previousUppercase === undefined) delete process.env.ADMIN_EMAILS;
        else process.env.ADMIN_EMAILS = previousUppercase;
        if (previousLowercase === undefined) delete process.env.admin_email;
        else process.env.admin_email = previousLowercase;
    }
}

test("recognizes verified Google admins in ADMIN_EMAILS", () => {
    withAdminEmails({ uppercase: "other@example.test, admin@EXAMPLE.test" }, () => {
        assert.equal(isAdmin(admin), true);
        assert.equal(isAdmin({ email: admin.email }), false);
    });
});

test("supports the legacy admin_email setting", () => {
    withAdminEmails({ lowercase: "admin@example.test" }, () => {
        assert.equal(isAdmin(admin), true);
    });
});

test("does not fail when no admin email list is configured", () => {
    withAdminEmails({}, () => {
        assert.equal(isAdmin(admin), false);
    });
});
