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

function dealJsDom(jQuery, filePathArr) {
    var $ = jQuery,
        scriptDomArr = $('script[src]');

    if (!scriptDomArr.length) {
        return;
    }

    scriptDomArr.each(function () {
        var scriptDom = $(this),
            scriptUrl = scriptDom.attr('src');

        for (var i = 0, length = filePathArr.length; i < length; i++) {
            var one = filePathArr[i];

            if (isMatch(scriptUrl, one.filePath)) {
                // 获得新的url，并替换src
                var newUrl = scriptUrl + "?_v=" + one.appendStr;
                if (newUrl) {
                    scriptDom.attr("src", newUrl);
                }
                break;
            }
        }
    });
}

function dealCssDom(jQuery, filePathArr) {
    var $ = jQuery,
        cssDomArr = $('link[rel="stylesheet"][href]');

    if (!cssDomArr.length) {
        return;
    }

    cssDomArr.each(function () {
        var cssDom = $(this),
            cssUrl = cssDom.attr('href');

        for (var i = 0, length = filePathArr.length; i < length; i++) {
            var one = filePathArr[i];

            if (isMatch(cssUrl, one.filePath)) {
                // 获得新的url，并替换src
                var newUrl = cssUrl + "?_v=" + one.appendStr;
                if (newUrl) {
                    cssDom.attr("href", newUrl);
                }
                break;
            }
        }
    });
}


/**
 * 获得要追加的字符串
 * @param grunt
 * @param options
 * @param filePath
 * @returns {*}
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
 * @param {Object}jQuery
 * @param {Object[]} fileArr 文件数组
 * @returns {String}
 */
exports.getHtmlContentSuffix = function (jQuery, fileArr) {
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
        dealJsDom($, jsArr);
    }

    //处理CSS
    if (cssArr.length) {
        dealCssDom($, cssArr);
    }

    return $.html();
};
