var LanguageTranslatorV2 = require('watson-developer-cloud/language-translator/v2');

var language_translator = new LanguageTranslatorV2({
    "username": "65384f22-403c-4155-99fd-ded2b7cb1a35",
    "password": "2egZAcp8AZYg",
    "url": "https://gateway.watsonplatform.net/language-translator/api"
});

const LANG_CODES = ['en','vi','nl','id','sv','de','lv','is','ku','nn','nb','tr','fi','fr','af','hu','sq','so','da','et',
                    'ro','eu','pt','ht','lt','pl','bs','es','it','az','eo','zh','sk','cs','zh-TW','ja','ko','hi','mn','ur',
                    'km','el','ru','bn','ar','te','pa','ka','gu','ta','he','uk','ps','kk','fa','ky','bg','be','hy','ml','ba','cv']

module.exports.identify = (text) => {
    return new Promise((resolve, reject) => {
        language_translator.identify({text}, (err, language) => {
            if (err) {reject(err)}
            else {resolve(language)}
        });
    });
}

module.exports.translate = (text, source, target) => {
    return new Promise((resolve, reject) => {
        console.log("got here1111")
        language_translator.translate({text, source, target}, (err, translation) => {
            console.log("got here1112222: " + err + " trans:" + JSON.stringify(translation, null, 4))

            if (err) {reject(err)}
            else {resolve(translation)}
        });
    });
}
