/**
 * 工具
 *
 * @author helinjiang
 * @date 2015/11/6
 */
var crypto = require('crypto');
var path = require('path');

/**
 * 获得文件的hash值
 * @param {string} content 文件内容
 * @param {string} encoding 文件的编码，默认为'utf8'
 * @param {string} type hash算法，例如md5、sha1、sha256、sha512等，默认为md5
 * @returns {string}
 */
exports.getHash = function (content, encoding, type) {
    return crypto.createHash(type).update(content, encoding).digest('hex');
};

/**
 * 将unix中的路径分隔符"\"替换为"/"来处理
 * @param {string} filePath 路径
 * @returns {string} 替换之后的结果
 */
exports.unixify = function (filePath) {
    return filePath.split('\\').join('/');
};

/**
 * 两个url是否匹配，只要其中一个是另外一个的子串就行了，最主要是判断加"./"的场景
 * @param {String} url1
 * @param {String} url2
 * @returns {Boolean}
 */
exports.isMatch = function (url1, url2) {
    return url1.search(url2) > -1 || url2.search(url1) > -1;
};

/**
 * 是否为外部链接，这个是泛指，例如下面的几个url就会返回true:
 *  https://nodejs.org/api/path.html#path_path_normalize_p
 *  http://nodejs.org/api/path.html#path_path_normalize_p
 *  //nodejs.org/api/path.html#path_path_normalize_p
 *
 * @param {String} url
 * @returns {Boolean}
 */
exports.isExternalUrl = function (url) {
    return !!url.match(/^http(s)?:\/\/|^\/\//);
};

/**
 * 获得获得to文件相对于from文件的路径。
 *
 * 例如:
 * from='tmp/requirejs/common.js';
 * to='tmp/requirejs/widget/note.js';
 * 则对from文件而言，to文件的相对地址为：'widget/note.js';
 *
 * @param {String} from 文件相对于Gruntfile.js的路径
 * @param {String} to 文件相对于Gruntfile.js的路径
 * @returns {String} JS和CSS文件相对于HTML的路径
 */
exports.getRelativeUrl = function (from, to) {

    // 例如：test/index.html相对于test/jsfile/xx.js则值为jsfile，但注意如果是在同一目录下时，使用path.relative会返回空值。
    var relativePath = path.relative(path.dirname(from), path.dirname(to)).replace(/\\/g, '/');

    return (relativePath ? (relativePath + '/') : '') + path.basename(to);
};

/**
 * 获得url文件名加入embedStr之后的值。
 * 例如url='xx/yy.js'，而embedStr='zz',则最终结果为'xx/yy.zz.js'
 * @param {String} url 要处理的url
 * @param {String} appendStr 要追加的字符串
 * @returns {String} 已经处理之后的url
 */
exports.getEmbedUrl = function (url, appendStr) {
    var extName = path.extname(url);

    url = url.substr(0, url.length - extName.length);

    return url + '.' + appendStr + extName;
};

/**
 * 获得url文件名加入embedStr之后的值。
 * 例如url='xx/yy.js'，而embedStr='zz',则最终结果为'xx/yy.zz.js'
 * @param {String} url 要处理的url
 * @param {String} embedStr 要追加的字符串
 * @returns {String} 已经处理之后的url
 */
exports.getSuffixUrl = function (url, appendStr) {
    appendStr = appendStr ? ('?_v=' + appendStr) : '';
    return url + appendStr;
};


/**
 * 获得url的不包含后缀的值
 * 例如url='xx/yy.js'，则最终结果为'xx/yy'
 * @param {String} url 要处理的url
 * @returns {String} 已经处理之后的url
 */
exports.getUrlWithoutExtName = function (url) {
    var urlWithoutExtName = url,
        urlExtName = path.extname(url);

    if (urlExtName) {
        urlWithoutExtName = urlWithoutExtName.substr(0, urlWithoutExtName.length - urlExtName.length);
    }

    return urlWithoutExtName;
};

/**
 * remove all commonets from js code.
 *
 * @param  {String}   str target string
 * @return {String}       result string
 * @see The <a href="http://james.padolsey.com/demos/comment-removal-js.html">Comment removal demo</a>.
 */
exports.removeComments = function (str) {

    var uid = '_' + (+new Date()),
        primatives = [],
        primIndex = 0;

    return (
        str
            /* Remove strings */
            .replace(/(['"])(\\\1|.)+?\1/g, function (match) {
                primatives[primIndex] = match;
                return (uid + '') + primIndex++;
            })

            /* Remove Regexes */
            .replace(/([^\/])(\/(?!\*|\/)(\\\/|.)+?\/[gim]{0,3})/g, function (match, $1, $2) {
                primatives[primIndex] = $2;
                return $1 + (uid + '') + primIndex++;
            })

            /*
             - Remove single-line comments that contain would-be multi-line delimiters
             E.g. // Comment /* <--
             - Remove multi-line comments that contain would be single-line delimiters
             E.g. /* // <--
             */
            .replace(/\/\/.*?\/?\*.+?(?=\n|\r|$)|\/\*[\s\S]*?\/\/[\s\S]*?\*\//g, '')

            /*
             Remove single and multi-line comments,
             no consideration of inner-contents
             */
            .replace(/\/\/.+?(?=\n|\r|$)|\/\*[\s\S]+?\*\//g, '')

            /*
             Remove multi-line comments that have a replace ending (string/regex)
             Greedy, so no inner strings/regexes will stop it.
             */
            .replace(new RegExp('\\/\\*[\\s\\S]+' + uid + '\\d+', 'g'), '')

            /* Bring back strings & regexes */
            .replace(new RegExp(uid + '(\\d+)', 'g'), function (match, n) {
                return primatives[n];
            })
    );
};