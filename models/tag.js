/**
 * Created by Julian on 01.03.2015.
 */
module.exports = function(mongoose) {
    return mongoose.model('Tag', {
        name: String,
        parent: {type: mongoose.Schema.Types.ObjectId, ref: 'Tag'}
    });
};