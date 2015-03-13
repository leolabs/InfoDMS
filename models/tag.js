/**
 * Created by Julian on 01.03.2015.
 */
module.exports = function(mongoose) {
    return mongoose.model('Tag', {
        name: String, // The tag name
        parent: {type: mongoose.Schema.Types.ObjectId, ref: 'Tag'} // The tag's parent (not in use)
    });
};