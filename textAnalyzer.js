/**
 * Created by leobernard on 09/02/15.
 */

var stopWords = [
    'aber',
    'als',
    'am',
    'an',
    'auch',
    'auf',
    'aus',
    'bei',
    'bin',
    'bis',
    'bist',
    'da',
    'dadurch',
    'daher',
    'darum',
    'das',
    'dass',
    'dass',
    'dein',
    'deine',
    'dem',
    'den',
    'der',
    'des',
    'dessen',
    'deshalb',
    'die',
    'dies',
    'dieser',
    'dieses',
    'doch',
    'dort',
    'du',
    'durch',
    'ein',
    'eine',
    'einem',
    'einen',
    'einer',
    'eines',
    'er',
    'es',
    'euer',
    'eure',
    'fuer',
    'hatte',
    'hatten',
    'hattest',
    'hattet',
    'hier',
    'hinter',
    'ich',
    'ihr',
    'ihre',
    'ihnen',
    'im',
    'in',
    'ist',
    'ja',
    'jede',
    'jedem',
    'jeden',
    'jeder',
    'jedes',
    'jener',
    'jenes',
    'jetzt',
    'kann',
    'kannst',
    'koennen',
    'koennt',
    'machen',
    'mein',
    'meine',
    'mit',
    'muss',
    'musst',
    'musst',
    'muessen',
    'muesst',
    'nach',
    'nachdem',
    'nein',
    'nicht',
    'nun',
    'nur',
    'oder',
    'seid',
    'sein',
    'seine',
    'sich',
    'sie',
    'sind',
    'soll',
    'sollen',
    'sollst',
    'sollt',
    'sonst',
    'soweit',
    'sowie',
    'und',
    'unser',
    'unsere',
    'unter',
    'vom',
    'von',
    'vor',
    'wann',
    'warum',
    'was',
    'weiter',
    'weitere',
    'wenn',
    'wer',
    'werde',
    'werden',
    'werdet',
    'weshalb',
    'wie',
    'wieder',
    'wieso',
    'wir',
    'wird',
    'wirst',
    'wo',
    'woher',
    'wohin',
    'zu',
    'zum',
    'zur',
    'ueber'
];

function findEqualKeywords(textFiles, textCategory) {
    var keywords = {};
    textFiles.forEach(function(file, index) {
        file.split(" ").forEach(function(word, index2) {
            word = word.trim().toLowerCase();
            word = word.replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss");
            word = word.replace(/[^a-z]/g, "");

            if(word != "" && word.length >= 3 && stopWords.indexOf(word) <= -1) {
                if(keywords.hasOwnProperty(word)) {
                    keywords[word] += 1;
                } else {
                    keywords[word] = 1;
                }
            }
        });
    });

    var mappedKeywords = Object.keys(keywords).map(function(value, index) {
        return {
            word: value,
            count: keywords[value] / textFiles.length
        }
    });

    mappedKeywords = mappedKeywords.sort(function(a, b){
        return b.count - a.count;
    });

    console.log("Keyword Count:", mappedKeywords.length);

    mappedKeywords = mappedKeywords.slice(0, 50);

    return mappedKeywords;
}

var fs = require('fs');

fs.readdir("/Users/leobernard/Desktop/Rechnungen/", function(err, files) {
    var texts = [];

    files.forEach(function(file, index){
        texts.push(fs.readFileSync("/Users/leobernard/Desktop/Rechnungen/" + file, "utf16le"));
    });

    console.log("File Count:", files.length);

    console.log(findEqualKeywords(texts, "Rechnung"));
});
