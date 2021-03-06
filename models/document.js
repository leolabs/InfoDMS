/**
 * Created by Julian on 26.02.2015.
 */

module.exports = function(mongoose) {
    return mongoose.model('Document', {
        name: String, // The document's name
        size: Number, // The document's size, in bytes
        hash: String, // The document's hash, usually sha1
        path: String, // The document's path, relative to server.js
        state: {type: String, enum: ['uploaded', 'extracting', 'extracted', 'analyzing', 'done'], default: 'uploaded'}, // The current document state
        type: String, // The document type, generated by the analyzer
        extension: String, // The document's extension, e.g. PDF
        uploadedDate: Date, // The timestamp of upload
        lastEditedDate: Date, // The timestamp of edit
        text: String, // The extracted text
        tags: [{type: mongoose.Schema.Types.ObjectId, ref: 'Tag'}], // A list of tags
        keywords: [{word: String, count: Number}] // The extracted keywords
    });
};