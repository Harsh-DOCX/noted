const mongoose = require("mongoose");

const notesSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
        default: ""
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    document: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model("Notes", notesSchema);