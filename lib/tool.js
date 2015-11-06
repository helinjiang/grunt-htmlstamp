/**
 * [文件描述]
 *
 * @author linjianghe
 * @date 2015/11/6
 */
var util = require('util');
var cheerio = require('cheerio');
var path = require('path');

var timestamp;

/**
 * 两个url是否匹配，只要其中一个是另外一个的子串就行了
 * @param {String} url1
 * @param {String} url2
 * @returns {Boolean}
 */
function isMatch(url1, url2) {
    return url1.search(url2) > -1 || url2.search(url1) > -1;
}

/**
 * 获得html文件的内容
 * @param {Object} jQuery
 * @param {Object[]} fileArr 文件数组
 * @param {Function} urlFunc 处理url的方法，返回一个新的url
 * @returns {String}
 */
function getHtmlContent(jQuery, fileArr, urlFunc) {
    var $ = jQuery,
        jsArr = [],
        cssArr = [];

    // 获得js和css文件数组
    fileArr.forEach(function (item) {
        var extName = path.extname(item.filePath);
        switch (extName) {
            case ".js":
                jsArr.push(item);
                break;
            case ".css":
                cssArr.push(item);
                break;
            default :
                break;
        }
    });

    //处理JS
    if (jsArr.length) {
        var scriptDomArr = $('script[src]');

        scriptDomArr.each(function () {
            var scriptDom = $(this),
                scriptUrl = scriptDom.attr('src');

            for (var i = 0, length = jsArr.length; i < length; i++) {
                var one = jsArr[i];

                if (isMatch(scriptUrl, one.filePath)) {
                    scriptDom.attr("src", urlFunc(scriptUrl, one.appendStr));
                    break;
                }
            }
        });

    }

    //处理CSS
    if (cssArr.length) {
        var cssDomArr = $('link[rel="stylesheet"][href]');

        cssDomArr.each(function () {
            var cssDom = $(this),
                cssUrl = cssDom.attr('href');

            for (var i = 0, length = cssArr.length; i < length; i++) {
                var one = cssArr[i];

                if (isMatch(cssUrl, one.filePath)) {
                    cssDom.attr("href", urlFunc(cssUrl, one.appendStr));
                    break;
                }
            }
        });
    }

    return $.html();
}

/**
 * 获得要追加的字符串
 * @param {Object} grunt
 * @param {Object} options 插件参数对象
 * @param {String} filePath 文件路径，因为hash时需要获取文件内容
 * @returns {String}
 */
exports.getAppendStr = function (grunt, options, filePath) {
    // 获得后缀或者时间戳的值，用于追加在后缀中或者嵌入到文件名内
    var appendStr;

    if (options.appendType === "hash") {
        // TODO 此处需要优化，不能够每次都去计算文件的hash值
        var source = grunt.file.read(filePath);
        appendStr = options.hashFunction(source, 'utf8').substr(0, 10);
    } else {
        // 优化：此处做一次缓存，确保生命周期内使用的是一个时间戳
        if (!timestamp) {
            timestamp = grunt.template.today(options.timestampFormat);
        }
        appendStr = timestamp;
    }

    return appendStr;
};

/**
 * 获得获得js或css文件相对于html文件的路径，但该路径值是在html引入的实际值的子集，例如计算获得的值为js/xx.js，但有可能在html中是使用./js/xx.js。
 * 我们要利用这个值去匹配html中的文件引用，进而去替换；而在此之前，src和dest的路径都是相对于Gruntfile.js的，因此要计算一下。
 * @param {String} htmlFilePath HTML文件相对于Gruntfile.js的路径
 * @param {String} jsCssFilePath JS和CSS文件相对于Gruntfile.js的路径
 * @returns {String} JS和CSS文件相对于HTML的路径
 */
exports.getPathInHtml = function (htmlFilePath, jsCssFilePath) {

    // 例如：test/index.html相对于test/jsfile/xx.js则值为jsfile，但注意如果是在同一目录下时，使用path.relative会返回空值。
    var relativePath = path.relative(path.dirname(htmlFilePath), path.dirname(jsCssFilePath)).replace(/\\/g, "/");

    return (relativePath ? (relativePath + "/") : "") + path.basename(jsCssFilePath);
};

/**
 * 获得新的html内容，采用suffix后缀模式处理js和css文件引用
 * @param {Object} jQuery
 * @param {Object[]} fileArr 文件数组
 * @returns {String}
 */
exports.getHtmlContentSuffix = function (jQuery, fileArr) {
    return getHtmlContent(jQuery, fileArr, function (url, appendStr) {
        // TODO 此处考虑是否存在_v这个key值
        return url + "?_v=" + appendStr;
    });
};

/**
 * 获得新的html内容，采用embed后缀模式处理js和css文件引用
 * @param {Object} jQuery
 * @param {Object[]} fileArr 文件数组
 * @returns {String}
 */
exports.getHtmlContentEmbed = function (jQuery, fileArr) {
    return getHtmlContent(jQuery, fileArr, function (url, appendStr) {
        var extName = path.extname(url);
        return url.replace(extName, '.' + appendStr + extName);
    });
};