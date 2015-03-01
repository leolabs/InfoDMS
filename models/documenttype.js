module.exports = function(mongoose) {
    return mongoose.model('DocumentType', {
        name: String,
        analyzedDocuments: Number,

        keywords: [{
            word: String,
            absoluteCount: Number,
            averageAbsoluteCount: Number
        }]
    });
};
