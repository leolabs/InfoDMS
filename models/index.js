/**
 * Created by leobernard on 13/02/15.
 */

module.exports = function(mongoose) {
    return {
        Document: require("./document")(mongoose), // Initialize the document model
        DocumentType: require("./documenttype")(mongoose), // Initialize the document type model
        Tag: require('./tag')(mongoose), // Initialize the tag model
        mongoose: mongoose,

        /**
         * Outputs a default database error
         * @param err the error
         * @param res the result-object
         */
        defaultDBError: function(err, res) {
            res.status(500).json({"error": "Database Error", message: err});
        }
    };
};