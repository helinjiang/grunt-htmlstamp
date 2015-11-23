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
var fileCopiedArr = [];

/**
 * config.js对应表，key值为taskTargt+文件相对于Gruntfile.js的路径，value值为热数据。
 * 在此缓存了数据，这样就不需要每次都要去读取config.js文件并找到paths对象了。
 *
 * 例如：
 * {
 *     'requirejs_complextmp/requirejs/common/config3.js': {
 *          content: String,
 *          pathsObj: Object
 *     }
 * }
 * @type {{}}
 */
var configJsMap = {};
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
        if (item.shimPath && !item.shimPathIsLocal) {
            newUrl = item.shimPath;
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
        if (item.shimPath && !item.shimPathIsLocal) {
            newUrl = item.shimPath;
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
        var filePath;

        if (item.shimPath && item.shimPathIsLocal) {
            // 如果配置了shim，且shimPath为本地文件，则使用这个shimPath
            filePath = item.shimPath;
        } else {
            // 否则直接使用filePath即可
            filePath = item.filePath;
        }

        var content = grunt.file.read(filePath);

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
        var filePath;

        if (item.shimPath && item.shimPathIsLocal) {
            // 如果配置了shim，且shimPath为本地文件，则拷贝这个shimPath
            filePath = item.shimPath;
        } else {
            // 否则直接拷贝filePath即可
            filePath = item.filePath;
        }

        var newPath = util.getEmbedUrl(filePath, item.appendStr);

        // 由于不同的html可能涉及同一个js/css，因此拷贝了一份之后就没必要再拷贝另外一份了。
        if (fileCopiedArr.indexOf(newPath) < 0) {
            // 拷贝
            grunt.file.copy(filePath, newPath);

            // 缓存
            fileCopiedArr.push(newPath);
        }

    });
};

/**
 * 如果是embed嵌入模式，html中修改了url还没完，必须要将相应文件拷贝一份
 * 要注意的是如果配置了shim，则只拷贝shim的文件
 * @param {Object} jQuery
 * @param {String} taskTarget 任务目标
 * @param {Object[]} fileArr 文件数组
 * @param {String} type 类型，此处取值为'suffix'或'embed'
 * @param {String} configUrl config.js的路径
 * @param {String} baseUrl config.js中baseUrl，但是相对于Gruntfile.js的路径
 * @returns {Boolean}
 */
exports.dealRequireJSConfig = function (grunt, taskTarget, fileArr, type, configUrl, baseUrl) {
    // 如果dataMainUrl不存在，则不再继续处理，因为该html可能只是普通的html引用而已
    if (!dataMainUrl) {
        return false;
    }

    var configObj = configJsMap[taskTarget + configUrl],
        infoObj,
        dataMainFileObj;

    if (!configObj) {
        configObj = {};
        configObj.url = configUrl;
        configObj.urlArgsReg = /urlArgs\s*:.*,/g;
        configObj.regPathsStr = /paths\s*:\s*\{[\r\n]*([^\}])*\}/g;
        configObj.content = util.removeComments(grunt.file.read(configObj.url));

        if (util.isEmbed(type)) {
            configObj.pathsObj = toolRequireJS.getPathsObj(configObj.content, configObj.regPathsStr);
        }

        configJsMap[taskTarget + configUrl] = configObj;
    }

    // 从fileArr中获取相关信息
    infoObj = toolRequireJS.getInfo(type, configObj.pathsObj, fileArr, dataMainUrl, configObj.url, baseUrl);
    configObj.configJsFileObj = infoObj.configJsFileObj;
    dataMainFileObj = infoObj.dataMainFileObj;

    // 获取要保存的路径
    if (util.isEmbed(type)) {
        // embed模式时，会改变文件名，生成一个新文件
        configObj.savePath = util.getEmbedUrl(configObj.url, configObj.configJsFileObj.appendStr);
    } else {
        // 不是embed模式时，只需要覆盖原文件即可
        configObj.savePath = configObj.url;
    }

    /**
     * 保存RequireJS的配置文件
     */
    toolRequireJS.saveRequireJSConfig(grunt, type, configObj);

    /**
     * 除了修改config.js文件之外，还有个地方要修改，就是修改引用config.js的文件的路径，即dataMain中的文件
     */
    if (!dataMainFileObj || !dataMainFileObj.filePath) {
        grunt.log.error('data-main file do not config in src, please add it in!');
        return false;
    } else {
        // 该地址为html中script的data-main标签上的值，该值与filePathInHtml值可能相同（区别在于有可能使用了"./"开头）
        dataMainFileObj.dataMainUrl = dataMainUrl;

        toolRequireJS.saveRequireJSDataMain(grunt, type, dataMainFileObj, configObj.configJsFileObj);
        return true;
    }
};
