module.exports = function(mongoose) {
    return mongoose.model('DocumentType', {
        name: String, // The type name, e.g. Receipt, Certificate, etc.
        analyzedDocuments: Number, // The number of analyzed documents

        keywords: [{ // The analyzed data
            word: String,
            absoluteCount: Number,
            averageAbsoluteCount: Number
        }]
    });
};
