/**
 * Created by leobernard on 13/02/15.
 */

module.exports = function(mongoose) {
    return {
        DocumentType: require("./documenttype")(mongoose),
        Document: require("./document")(mongoose),
        mongoose: mongoose,

        defaultDBError: function(err, res) {
            res.status(500).json({"error": "Database Error", message: err});
        }
    };
};