/**
 * Created by Julian on 26.02.2015.
 */
module.exports = function(mongoose) {
    return mongoose.model('Document', {
        name: String,
        hashValue: String,
        uploadedDate: Date,
        lastEditedDate: Date,
        tags: [{
            tag: String,
            priority: Number
        }],
        keywords: [{
            word: String,
            absoluteCount: Number
        }]
    });
};