/**
 * Created by leobernard on 13/02/15.
 */

module.exports = function(mongoose) {
    return {
        DocumentType: require("./documenttype")(mongoose),

        mongoose: mongoose
    };
};