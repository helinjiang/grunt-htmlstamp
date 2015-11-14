/**
 * 业务处理
 *
 * @author helinjiang
 * @date 2015/11/6
 */

var path = require('path');
var util = require('./util');
var toolRequireJS = require('./tool_for_requirejs');

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
 * 已经拷贝过的文件，这些文件已经生成了就不要重复生成了
 *
 * @type {Array}
 */
var fileCopyedArr = [];

var dataMainUrl;

/**
 * 获得html文件的内容
 * @param {Object} jQuery
 * @param {Object[]} fileArr 文件数组
 * @param {Function} urlFunc 处理url的方法
 * @param {String} scriptAttr script标签上要处理的属性，src或data-main
 * @returns {String}
 */
function getHtmlContent(jQuery, fileArr, urlFunc, scriptAttr) {
    var $ = jQuery,
        jsArr = [],
        cssArr = [];

    // 获得js和css文件数组
    fileArr.forEach(function (item) {
        var extName = path.extname(item.filePathInHtml);
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
        var scriptDomArr = $('script[' + scriptAttr + ']');

        scriptDomArr.each(function () {
            var scriptDom = $(this),
                scriptUrl = scriptDom.attr(scriptAttr);

            if (!util.isExternalUrl(scriptUrl)) {
                for (var i = 0, length = jsArr.length; i < length; i++) {
                    var one = jsArr[i];

                    if (util.isMatch(scriptUrl, one.filePathInHtml)) {
                        urlFunc(scriptDom, scriptUrl, one, scriptAttr);

                        if (scriptAttr === "data-main") {
                            dataMainUrl = scriptUrl;
                        }

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

            if (!util.isExternalUrl(cssUrl)) {
                for (var i = 0, length = cssArr.length; i < length; i++) {
                    var one = cssArr[i];

                    if (util.isMatch(cssUrl, one.filePathInHtml)) {
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
 * 获得新的html内容，采用suffix模式处理js和css文件引用
 * @param {Object} jQuery
 * @param {Object[]} fileArr 文件数组
 * @returns {String}
 */
exports.getHtmlContentSuffix = function (jQuery, fileArr, scriptAttr) {
    return getHtmlContent(jQuery, fileArr, function (elem, url, item, attrName) {
        var newUrl = url;

        // shim中若有配置，则此时要替换,对url进行处理
        if (item.shimPathToReplace) {
            newUrl = item.shimPathToReplace;
        } else {
            if (item.shimPathInHtml) {
                newUrl = newUrl.replace(item.filePathInHtml, item.shimPathInHtml);
            }

            newUrl = newUrl + '?_v=' + item.appendStr;
        }

        elem.attr(attrName, newUrl);
    }, scriptAttr);
};

/**
 * 获得新的html内容，采用embed模式处理js和css文件引用
 * @param {Object} jQuery
 * @param {Object[]} fileArr 文件数组
 * @returns {String}
 */
exports.getHtmlContentEmbed = function (jQuery, fileArr, scriptAttr) {
    return getHtmlContent(jQuery, fileArr, function (elem, url, item, attrName) {
        var newUrl = url;

        // shim中若有配置，则此时要替换,对url进行处理
        if (item.shimPathToReplace) {
            newUrl = item.shimPathToReplace;
        } else {
            if (item.shimPathInHtml) {
                newUrl = newUrl.replace(item.filePathInHtml, item.shimPathInHtml);
            }

            newUrl = util.getEmbedUrl(newUrl, item.appendStr);
        }

        elem.attr(attrName, newUrl);
    }, scriptAttr);
};

/**
 * 获得新的html内容，采用inline模式处理js和css文件引用
 * @param {Object} jQuery
 * @param {Object[]} fileArr 文件数组
 * @returns {String}
 */
exports.getHtmlContentInline = function (jQuery, fileArr, scriptAttr, grunt) {
    return getHtmlContent(jQuery, fileArr, function (elem, url, item, attrName) {
        var content = grunt.file.read(item.filePath);

        // 此处用属性值来判断，<script>的属性值为src，而<link>属性值为href
        if (attrName === 'src' || attrName === 'data-main') {
            content = '<script type="text/javascript">' + content + '</script>';
        } else {
            content = '<style>' + content + '</style>';
        }

        elem.replaceWith(content);
    }, scriptAttr);
};

/**
 * 如果是embed嵌入模式，html中修改了url还没完，必须要将相应文件拷贝一份
 * 要注意的是如果配置了shim，则只拷贝shim的文件
 * @param {Object} jQuery
 * @param {Object[]} fileArr 文件数组
 */
exports.copyFileIfEmbed = function (grunt, fileArr) {
    fileArr.forEach(function (item) {
        // 如果是替换外部链接的模式，则不再拷贝文件了
        if (!item.shimPathToReplace) {
            var filePath = item.shimPathToCopy || item.filePath,
                newPath = util.getEmbedUrl(filePath, item.appendStr);

            if (fileCopyedArr.indexOf(newPath) < 0) {
                // 拷贝
                grunt.file.copy(filePath, newPath);

                // 缓存
                fileCopyedArr.push(newPath);
            }
        }
    });
};

/**
 * 如果是embed嵌入模式，html中修改了url还没完，必须要将相应文件拷贝一份
 * 要注意的是如果配置了shim，则只拷贝shim的文件
 * @param {Object} jQuery
 * @param {Object[]} fileArr 文件数组
 * @param {String} type 类型，此处取值为'suffix'或'embed'
 * @param {String} configUrl config.js的路径
 * @param {String} baseUrl config.js中baseUrl，但是相对于Gruntfile.js的路径
 * @returns {Boolean}
 */
exports.dealRequireJSConfig = function (grunt, fileArr, type, configUrl, baseUrl) {
    // 如果dataMainUrl不存在，则不再继续处理，因为该html可能只是普通的html引用而已
    if (!dataMainUrl) {
        return false;
    }

    /**
     * 获取config.js中的文件内容，并且移除注释
     */
    var content = grunt.file.read(configUrl),
        contentOnly = util.removeComments(content),
        regPathsStr = /paths\s*:\s*\{[\r\n]*(.*[\r\n]*)*?\s*\}/g,
        pathObj,
        dataMainObj,
        configJsObj,
        configSavePath,
        mapPathsObj,
        infoObj;

    if (util.isEmbed(type)) {
        pathObj = toolRequireJS.getPathsObj(contentOnly, regPathsStr);
        infoObj = toolRequireJS.getInfo(type, pathObj, fileArr, dataMainUrl, configUrl, baseUrl);
        mapPathsObj = infoObj.map;
        configJsObj = infoObj.configJsObj;
        dataMainObj = infoObj.dataMainObj;

        // embed模式时，会改变文件名，生成一个新文件
        configSavePath = util.getEmbedUrl(configUrl, configJsObj.appendStr);

    } else {
        infoObj = toolRequireJS.getInfo(type, pathObj, fileArr, dataMainUrl, configUrl, baseUrl);
        configJsObj = infoObj.configJsObj;
        dataMainObj = infoObj.dataMainObj;

        // 不是embed模式时，只需要覆盖原文件即可
        configSavePath = configUrl;

    }

    /**
     * 保存RequireJS的配置文件
     */
    toolRequireJS.saveRequireJSConfig(grunt, type, contentOnly, regPathsStr, mapPathsObj, configSavePath);

    /**
     * 除了修改config.js文件之外，还有个地方要修改，就是修改引用config.js的文件的路径，即dataMain中的文件
     */
    if (!dataMainObj || !dataMainObj.filePath) {
        grunt.log.error('data-main file do not config in src, please add it in!');
        return false;
    } else {
        toolRequireJS.saveRequireJSDataMain(grunt, type, dataMainObj, configJsObj);
        return true;
    }
};
