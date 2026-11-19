const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const LoginRouter = require("./Routes/Login");
const notesRouter = require("./Routes/notes");
const { dbConnect } = require("./config/dbConnect");

const PORT = process.env.PORT || 5000;

const corsOptions = {
    origin: (process.env.CORS_ORIGIN || "http://localhost:3000").split(","),
    credentials: true,
    optionSuccessStatus: 200,
};

const app = express();

app.use(cors(corsOptions));
app.use(express.json({ limit: "15mb" }));

app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
});

dbConnect()

app.use("/login", LoginRouter);
app.use("/notes", notesRouter);

app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

app.use((error, req, res, next) => {
    if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
        return res.status(400).json({ message: "Request body must be valid JSON" });
    }
    if (error.status === 413) {
        return res.status(413).json({ message: "PDF files must be 10 MB or smaller" });
    }

    console.error("Unhandled request error:", error);
    return res.status(500).json({ message: "Internal server error" });
});



app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});