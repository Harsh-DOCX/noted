const express = require("express");
const mongoose = require("mongoose");
const Notes = require("../model/Notes");
const User = require("../model/userSchema");
const requireAuth = require("../middleware/requireAuth");

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
        return res.status(201).json(note);
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
        const notes = await Notes.find().sort({ createdAt: -1 }).populate("uploadedBy", authorFields);
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
            .sort({ createdAt: -1 })
            .populate("uploadedBy", authorFields);
        return res.status(200).json(notes);
    } catch (error) {
        console.error("Error fetching notes for user:", error);
        return res.status(500).json({ message: "Unable to fetch notes for user" });
    }
});

router.get("/get-note/search/:searchTerm", requireAuth, async (req, res) => {
    const searchTerm = req.params.searchTerm.trim();
    if (!searchTerm || searchTerm.length > 100) {
        return res.status(400).json({ message: "Search term must be between 1 and 100 characters" });
    }

    try {
        const query = escapeRegex(searchTerm);
        const matchingUsers = await User.find({
            $or: [
                { username: { $regex: query, $options: "i" } },
                { fullName: { $regex: query, $options: "i" } },
            ],
        }).select("_id");
        const notes = await Notes.find({
            $or: [
                { title: { $regex: query, $options: "i" } },
                { uploadedBy: { $in: matchingUsers.map((user) => user._id) } },
            ],
        }).sort({ createdAt: -1 }).populate("uploadedBy", authorFields);
        return res.status(200).json(notes);
    } catch (error) {
        console.error("Error searching notes:", error);
        return res.status(500).json({ message: "Unable to search notes" });
    }
});

router.get("/:noteId", requireAuth, async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.noteId)) {
        return res.status(400).json({ message: "Invalid note ID" });
    }

    try {
        const note = await Notes.findById(req.params.noteId).populate("uploadedBy", authorFields);
        if (!note) {
            return res.status(404).json({ message: "Note not found" });
        }
        return res.status(200).json(note);
    } catch (error) {
        console.error("Error fetching note:", error);
        return res.status(500).json({ message: "Unable to fetch note" });
    }
});

router.patch("/:noteId", requireAuth, async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.noteId)) {
        return res.status(400).json({ message: "Invalid note ID" });
    }

    const { title, document } = req.body || {};
    if (
        (title === undefined && document === undefined)
        || (title !== undefined && typeof title !== "string")
        || (document !== undefined && !isPdfDocument(document))
    ) {
        return res.status(400).json({ message: "Provide a valid title or document to update" });
    }

    const updates = {};
    if (title !== undefined) updates.title = title.trim();
    if (document !== undefined) updates.document = document.trim();

    try {
        const note = await Notes.findOneAndUpdate(
            { _id: req.params.noteId, uploadedBy: req.userId },
            { $set: updates },
            { new: true, runValidators: true },
        ).populate("uploadedBy", authorFields);
        if (!note) {
            return res.status(404).json({ message: "Note not found or not owned by this user" });
        }
        return res.status(200).json(note);
    } catch (error) {
        console.error("Error updating note:", error);
        return res.status(500).json({ message: "Unable to update note" });
    }
});

router.delete("/:noteId", requireAuth, async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.noteId)) {
        return res.status(400).json({ message: "Invalid note ID" });
    }

    try {
        const note = await Notes.findOneAndDelete({
            _id: req.params.noteId,
            uploadedBy: req.userId,
        });
        if (!note) {
            return res.status(404).json({ message: "Note not found or not owned by this user" });
        }
        return res.status(200).json({ message: "Note deleted successfully" });
    } catch (error) {
        console.error("Error deleting note:", error);
        return res.status(500).json({ message: "Unable to delete note" });
    }
});

module.exports = router;
