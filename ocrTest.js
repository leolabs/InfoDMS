/**
 * Created by leobernard on 01/03/15.
 */

var pdfExtract = require('pdf-extract');

var options = {
    type: 'text', // (required), perform ocr to get the text within the scanned image
    ocr_flags: [
        'alphanumeric'  // only output ascii characters
    ]
};

var processor = pdfExtract("/Users/leobernard/Desktop/02182015164813.pdf", options, function(err) {
    if (err) {
        console.error(err);
    }
});

processor.on('complete', function(data) {
    console.log(data);
});

processor.on('error', function(err) {
    console.error(err);
});