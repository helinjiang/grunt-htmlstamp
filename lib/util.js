/**
 * 工具
 *
 * @author helinjiang
 * @date 2015/11/6
 */
var crypto = require('crypto');
var path = require('path');


/**
 * 判断是否为type=embed模式
 * @param {String} type
 * @returns {Boolean}
 */
exports.isEmbed = function (type) {
    return type && (type === 'embed');
};

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
 * 两个url是否匹配
 * TODO 此方法不一定精确，但只要正常的使用，一般也不会有误差。后续待优化。也可以用户自己配置options来匹配规则
 * @param {String} url1
 * @param {String} url2
 * @returns {Boolean}
 */
exports.isMatch = function (url1, url2) {
    // 如果两个url的文件名不一样，则肯定不匹配
    if (path.basename(url1) !== path.basename(url2)) {
        return false;
    }

    // 判断加"./"的场景，如果其中一个是另外一个的子串就行了
    if (url1.indexOf(url2) > -1 || url2.indexOf(url1) > -1) {
        return true;
    }

    // 判断整个路径，然后尽可能去匹配
    var url1Arr = url1.split("/"),
        url2Arr = url2.split("/");

    if (url1Arr.length < 2 || url2Arr.length < 2) {
        // 如果只有一个'/'分隔，则直接返回true，因为{xx}/test.js和t1/t2/test.js有很大可能是相同的，虽然不严谨
        return true;
    } else if (url1Arr[url1.length - 2] === url2Arr[url2.length - 2]) {
        // 如果都有多重路径，那么至少存在一个父路径是相同的，则可以初步认为整个url是指同一个，例如{xx}/t2/test.js和t1/t2/test.js
        return true;
    } else {
        // {xx}/t3/test.js和t1/t2/test.js肯定不同
        return false;
    }
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
 * 获得获得from文件到to文件的路径。
 *
 * 例如:
 * from='tmp/requirejs/common.js';
 * to='tmp/requirejs/widget/note.js';
 * 则对from文件而言，to文件的相对地址为：'widget/note.js';
 *
 * @param {String} from 起始路径
 * @param {String} to 结束路径
 * @returns {String} 计算结果
 */
exports.getRelativeUrl = function (from, to) {

    // 例如：test/index.html相对于test/jsfile/xx.js则值为jsfile，但注意如果是在同一目录下时，使用path.relative会返回空值。
    var relativePath = path.relative(path.dirname(from), path.dirname(to)).replace(/\\/g, '/');

    return (relativePath ? (relativePath + '/') : '') + path.basename(to);
};


/**
 * 获得获得from文件的relativePath之后的路径
 *
 * 例如:
 * from='dist/js/page/index.js';
 * to='../common';
 * 结果为：'dist/js/common';
 *
 * @param {String} from 起始路径
 * @param {String} relativePath 相对路径
 * @returns {String} 计算结果
 */
exports.getNormalizeUrl = function (from, relativePath) {
    return path.normalize(path.dirname(from) + '/' + relativePath).replace(/\\/g, '/');
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