/**
 * [文件描述]
 *
 * @author linjianghe
 * @date 2015/11/6
 */

var path = require('path');

/**
 * 时间戳，由于某一次编译只有一个时间戳，因此在此缓存
 */
var timestamp;

/**
 * hash文件对应表，key值为文件相对于Gruntfile.js的路径，value值是要追加的hash字符串。
 * 因为一个文件只可能有一个hash值，因此不需要重复去计算，在此进行缓存
 *
 * 例如：
 * {
 *     'test/fixtures/test1.js':  'f8c0db01a0'
 * }
 * @type {{}}
 */
var fileHashMap = {};

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
 * 是否为外部链接，这个是泛指，例如下面的几个url就会返回true:
 *  https://nodejs.org/api/path.html#path_path_normalize_p
 *  http://nodejs.org/api/path.html#path_path_normalize_p
 *  //nodejs.org/api/path.html#path_path_normalize_p
 *
 * @param {String} url
 * @returns {Boolean}
 */
function isExternalUrl(url) {
    return !!url.match(/^http(s)?:\/\/|^\/\//);
}

/**
 * 获得html文件的内容
 * @param {Object} jQuery
 * @param {Object[]} fileArr 文件数组
 * @param {Function} urlFunc 处理url的方法
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
            case '.js':
                jsArr.push(item);
                break;
            case '.css':
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

            if (!isExternalUrl(scriptUrl)) {
                for (var i = 0, length = jsArr.length; i < length; i++) {
                    var one = jsArr[i];

                    if (isMatch(scriptUrl, one.filePath)) {
                        urlFunc(scriptDom, scriptUrl, one, 'src');
                        break;
                    }
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

            if (!isExternalUrl(cssUrl)) {
                for (var i = 0, length = cssArr.length; i < length; i++) {
                    var one = cssArr[i];

                    if (isMatch(cssUrl, one.filePath)) {
                        urlFunc(cssDom, cssUrl, one, 'href');
                        break;
                    }
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

    if (options.appendType === 'hash') {
        // 优化：此处做一次缓存，不同的任务可能会处理到同一个js或css文件，比如两个页面都引入了common.js，此时不需要每次都计算hash值
        appendStr = fileHashMap[filePath];
        if (!appendStr) {
            var source = grunt.file.read(filePath);
            appendStr = options.hashFunction(source, 'utf8').substr(0, 10);

            // 缓存之
            fileHashMap[filePath] = appendStr;
        }
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
    var relativePath = path.relative(path.dirname(htmlFilePath), path.dirname(jsCssFilePath)).replace(/\\/g, '/');

    return (relativePath ? (relativePath + '/') : '') + path.basename(jsCssFilePath);
};

/**
 * 获得新的html内容，采用suffix模式处理js和css文件引用
 * @param {Object} jQuery
 * @param {Object[]} fileArr 文件数组
 * @returns {String}
 */
exports.getHtmlContentSuffix = function (jQuery, fileArr) {
    return getHtmlContent(jQuery, fileArr, function (elem, url, item, attrName) {
        // TODO 此处考虑是否存在_v这个key值
        var newUrl = url + '?_v=' + item.appendStr;

        elem.attr(attrName, newUrl);
    });
};

/**
 * 获得新的html内容，采用embed模式处理js和css文件引用
 * @param {Object} jQuery
 * @param {Object[]} fileArr 文件数组
 * @returns {String}
 */
exports.getHtmlContentEmbed = function (jQuery, fileArr) {
    return getHtmlContent(jQuery, fileArr, function (elem, url, item, attrName) {
        var extName = path.extname(url),
            newUrl = url.replace(extName, '.' + item.appendStr + extName);

        elem.attr(attrName, newUrl);
    });
};

/**
 * 获得新的html内容，采用inline模式处理js和css文件引用
 * @param {Object} jQuery
 * @param {Object[]} fileArr 文件数组
 * @returns {String}
 */
exports.getHtmlContentInline = function (jQuery, fileArr, grunt) {
    return getHtmlContent(jQuery, fileArr, function (elem, url, item, attrName) {
        var content = grunt.file.read(item.localPath);

        // 此处用属性值来判断，<script>的属性值为src，而<link>属性值为href
        if (attrName === 'src') {
            content = '<script type="text/javascript">' + content + '</script>';
        } else {
            content = '<style>' + content + '</style>';
        }

        elem.replaceWith(content);
    });
};


/**
 * 如果是embed嵌入模式，html中修改了url还没完，必须要将相应文件拷贝一份
 * @param {Object} jQuery
 * @param {Object[]} fileArr 文件数组
 * @returns {String}
 */
exports.copyFileIfEmbed = function (grunt, fileArr) {
    fileArr.forEach(function (item) {
        var localPath = item.localPath,
            extName = path.extname(localPath),
            newPath = localPath.replace(extName, '.' + item.appendStr + extName);

        grunt.file.copy(localPath, newPath);
    });
};
