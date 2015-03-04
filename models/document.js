/**
 * Created by Julian on 26.02.2015.
 */
module.exports = function(mongoose) {
    return mongoose.model('Document', {
        name: String,
        size: Number,
        hash: String, //Oder Number?
        path: String,
        extension: String,
        uploadedDate: Date,
        lastEditedDate: Date,
        text: String,

        tags: [{type: mongoose.Schema.Types.ObjectId, ref: 'Tag'}],
        keywords: [{
            word: String,
            absoluteCount: Number
        }]
    });
};