const express = require("express");
const mongoose = require("mongoose");
const Notes = require("../model/Notes");
const User = require("../model/userSchema");
const requireAuth = require("../middleware/requireAuth");
const { isAdmin } = require("../utils/admin");

const router = express.Router();
const authorFields = "username fullName";
const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const maxPdfSize = 10 * 1024 * 1024;
const isPdfDocument = (value) => {
    if (typeof value !== "string") return false;
    const match = /^data:application\/pdf;base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
    if (!match) return false;
    const pdf = Buffer.from(match[1], "base64");
    return pdf.length <= maxPdfSize && pdf.subarray(0, 5).toString("ascii") === "%PDF-";
};

router.post("/upload", requireAuth, async (req, res) => {
    const { document, title = "" } = req.body || {};
    if (!isPdfDocument(document) || typeof title !== "string") {
        return res.status(400).json({ message: "A valid PDF document and title are required" });
    }

    try {
        const note = await Notes.create({
            uploadedBy: req.userId,
            document: document.trim(),
            title: title.trim(),
        });
        await note.populate("uploadedBy", authorFields);
        const noteData = note.toObject();
        delete noteData.document;
        return res.status(201).json(noteData);
    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({ message: "Note details are invalid" });
        }
        console.error("Error uploading note:", error);
        return res.status(500).json({ message: "Unable to upload note" });
    }
});

router.get("/get-notes", requireAuth, async (req, res) => {
    try {
        const notes = await Notes.find()
            .select("-document")
            .sort({ createdAt: -1 })
            .populate("uploadedBy", authorFields);
        return res.status(200).json(notes);
    } catch (error) {
        console.error("Error fetching notes:", error);
        return res.status(500).json({ message: "Unable to fetch notes" });
    }
});

router.get("/get-notes/:userId", requireAuth, async (req, res) => {
    const { userId } = req.params;
    if (!mongoose.isValidObjectId(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
    }

    try {
        const notes = await Notes.find({ uploadedBy: userId })
            .select("-document")
            .sort({ createdAt: -1 })
            .populate("uploadedBy", authorFields);
        return res.status(200).json(notes);
    } catch (error) {
        console.error("Error fetching notes for user:", error);
        return res.status(500).json({ message: "Unable to fetch notes for user" });
    }
});

router.get("/:noteId/document", requireAuth, async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.noteId)) {
        return res.status(400).json({ message: "Invalid note ID" });
    }

    try {
        const note = await Notes.findById(req.params.noteId).select("document");
        if (!note) {
            return res.status(404).json({ message: "Note not found" });
        }

        const match = /^data:application\/pdf;base64,([A-Za-z0-9+/]+={0,2})$/.exec(note.document);
        if (!match) {
            return res.status(500).json({ message: "The stored PDF is invalid" });
        }

        return res
            .type("application/pdf")
            .set("Content-Disposition", `inline; filename="note-${note.id}.pdf"`)
            .set("Cache-Control", "private, no-store")
            .send(Buffer.from(match[1], "base64"));
    } catch (error) {
        console.error("Error fetching note document:", error);
        return res.status(500).json({ message: "Unable to fetch note document" });
    }
});

router.delete("/:noteId", requireAuth, async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.noteId)) {
        return res.status(400).json({ message: "Invalid note ID" });
    }

    try {
        const user = await User.findById(req.userId).select("email googleId");
        if (!user) {
            return res.status(401).json({ message: "Authenticated user not found" });
        }

        const filter = { _id: req.params.noteId };
        if (!isAdmin(user)) {
            filter.uploadedBy = req.userId;
        }

        const note = await Notes.findOneAndDelete(filter);
        if (!note) {
            return res.status(404).json({ message: "Note not found" });
        }
        return res.status(200).json({ message: "Note deleted successfully" });
    } catch (error) {
        console.error("Error deleting note:", error);
        return res.status(500).json({ message: "Unable to delete note" });
    }
});

module.exports = router;
