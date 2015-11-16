/**
 * [文件描述]
 *
 * @author helinjiang
 * @date 2015/11/13
 */

var util = require('./util');
var path = require('path');

/**
 * 已经处理过的文件集合。
 * 多任务场景下，同一个js或css文件可能会被多个任务处理，而实际上它们只需要被处理一次即可
 * @type {Array}
 */
var handledFileArr = [];

/**
 * 获得config.js中
 * @param {String} configContent config.js的内容，建议是无注释版本的内容
 * @param {RegExp} regPathsStr 用于匹配paths的正则表达式
 * @returns {{map: {}, mapExternal: {}}}
 */
exports.getPathsObj = function (configContent, regPathsStr) {
    var regPathStrResult = configContent.match(regPathsStr);

    // 有可能config.js中就没配置过paths属性
    if (!regPathStrResult) {
        return {};
    }

    var pathsStr = regPathStrResult[0].replace(/[\r\n]/g, '').replace(/\s+/g, ' '),
        regPathParamStr = /paths\s*:\s*\{\s*(.*,?)*\s*\}/,
        pathParamStr = pathsStr.match(regPathParamStr)[1],
        pathParamArr = pathParamStr.split(',');

    // 区分外部链接和相对链接，如果是外部连接，则不进行处理
    var map = {},
        regDot = /\'|\"/g;

    pathParamArr.forEach(function (item) {
        if (item.trim() !== "") {
            var tarr = item.split(":"),
                key = tarr.shift().replace(regDot, '').trim(),
                value = tarr.join(":").replace(regDot, '').trim();

            map[key] = value;
        }
    });

    return map;
};

/**
 * 获取信息，包括新的paths对应的对象、data-main文件对象和config.js文件要追加的字符
 * @param {String} type
 * @param {Object} pathObj
 * @param {Array} fileArr 文件对象数组
 * @param {String} dataMainUrl data-main属性对应的值
 * @param {String} configUrl config.js的路径
 * @param {String} baseUrl 与config.js中的baseUrl是一样的含义，区别在于此处的url是相对Gruntfile.js而言的
 * @returns {{map: *, dataMainObj: *, configJsObj: *}}
 */
exports.getInfo = function (type, pathsObj, fileArr, dataMainUrl, configUrl, baseUrl) {
    var fMap = {},
        dataMainFileObj,
        configJsFileObj;

    if (util.isEmbed(type)) {
        // 将以"./"开头的路径都去掉这个
        for (var k in pathsObj) {
            fMap[pathsObj[k].replace(/^\.\//, '')] = k;
        }
    }

    // 计算
    fileArr.forEach(function (item) {
        if (util.isMatch(item.filePathInHtml, dataMainUrl)) {
            // 如果是data-main中的链接，则不处理，因为它不会在config.js中配置
            dataMainFileObj = item;
        } else if (configUrl === item.filePath) {
            // 如果是config.js中的链接，也不处理
            configJsFileObj = item;
        } else if (util.isEmbed(type)) {

            var relativeUrl = util.getRelativeUrl(baseUrl + '/_just_easy_to_calculate.js', item.filePath),
                relativeUrlName = util.getUrlWithoutExtName(relativeUrl),
                mapK = fMap[relativeUrlName],
                newValue = relativeUrlName + "." + item.appendStr;

            // 如果原map中存在该key值，则覆盖，否则新建之
            pathsObj[mapK || relativeUrlName] = newValue;

        }
    });

    return {
        dataMainFileObj: dataMainFileObj,
        configJsFileObj: configJsFileObj
    };
};

/**
 * 保存新的config.js文件
 * @param {Object} grunt
 * @param {String} type
 * @param {Object} configObj
 */
exports.saveRequireJSConfig = function (grunt, type, configObj) {
    var configSavePath = configObj.savePath,
        newContent = configObj.content,
        urlArgsReg = configObj.urlArgsReg,
        regPathsStr = configObj.regPathsStr,
        pathsObj = configObj.pathsObj;

    if (util.isEmbed(type)) {
        // 将新的paths替换原config.js文件中的paths，同时移除urlArgs，因为这个参数是在开发场景时才使用
        if (!Object.keys(pathsObj).length) {
            // 如果pathsObj为空，则不进行处理。这种状况一般发生在该html没有任何依赖的js
        } else if (newContent.match(regPathsStr)) {
            // 如果config.js的内容有paths，则替换之
            newContent = newContent.replace(regPathsStr, "paths:" + JSON.stringify(pathsObj)).replace(urlArgsReg, '');
        } else {
            // 如果config.js的内容没有paths，则追加之

        }
    } else {
        // 如果没有urlArgs字段，则追加之
        if (!newContent.match(urlArgsReg)) {
            newContent = newContent.replace(regPathsStr, function (match) {
                return 'urlArgs: "_v=" + (new Date()).getTime(),' + match;
            });
        }
    }

    //缓存新内容
    configObj.content = newContent;

    // 保存
    grunt.file.write(configSavePath, newContent);
};

/**
 * 保存新的data-main文件
 * @param {String} type 类型
 * @param {Object} grunt
 * @param {Object} dataMainObj data-main的文件对象
 * @param {Object} configJsObj config.js的文件对象
 */
exports.saveRequireJSDataMain = function (grunt, type, dataMainObj, configJsObj) {
    // 用于在data-main文件中匹配config.js的字符串
    var configInPageUrl = util.getRelativeUrl(dataMainObj.filePath, configJsObj.filePath),
        configInPageUrlName = util.getUrlWithoutExtName(configInPageUrl),
        dataMainContent = grunt.file.read(dataMainObj.filePath),
        newConfigInPageUrl,
        dataMainSavePath,
        newDataMainContent;

    var reg = new RegExp('(require.*?\\(.*\\[\\s*.*[\'\"]\\s*)(' + configInPageUrlName + '(.js)?)(\\s*[\'\"].*\\])', 'g');

    if (util.isEmbed(type)) {
        // 将xxx/config修改为xxx/config.[appendStr]
        newConfigInPageUrl = util.getEmbedUrl(configInPageUrlName, configJsObj.appendStr);

        // 由于在此之前dataMainPath文件已经被重命名了，因此这里要修改的已经被重命名的那个文件，而不是原始文件，
        // 但此处也将有一个小的缺憾，就是再次修改了data-main的文件，其MD5值已经不是现在文件名中的那个值，但也应该无关紧要了。
        dataMainSavePath = util.getEmbedUrl(dataMainObj.filePath, dataMainObj.appendStr);

        // 获得了要替换的新的字符串之后，正则替换之
        newDataMainContent = dataMainContent.replace(reg, function (p, $1, $2, $3, $4) {
            //$3为.js或者undefined，需要稍微处理下将undefined转换为空
            var postfix = $3 || '';
            return $1 + newConfigInPageUrl + postfix + $4;
        });
    } else {
        /**
         * 如果有.js后缀，则该路径为相对于html页面而言的，可能是相对路径，也可能是绝对路径，这种场景最好处理，只需要在js后面加时间戳即可
         * 如果无.js后缀，则该路径是相对于当前js页面而言的相对路径。此场景比较难处理，因为要将其转换为.js的场景
         */

        var configFileName = path.basename(configJsObj.filePath);

        // 如果搜索configFileName有值，则说明是以.js结尾的，此时只要修改为.js?_v=[appendStr]即可
        var reg2 = new RegExp('(require.*?\\(.*\\[\\s*.*[\'\"]\\s*.*)(' + configFileName + ')(\\s*[\'\"].*\\])', 'g');

        if (dataMainContent.match(reg2)) {
            // 如果搜索configFileName有值，则说明是以.js结尾的，此时只要修改为.js?_v=[appendStr]即可
            // TODO 此处可能不太严谨，但也应该影响不大，即便很多个同时匹配增加了时间戳也没问题，如果是字符串里面匹配到的话，几率比较小
            newDataMainContent = dataMainContent.replace(reg2, function (p, $1, $2, $3) {
                return $1 + util.getSuffixUrl($2, configJsObj.appendStr) + $3;
            });
        } else {
            // 如果reg2没匹配，则说明是无.js结尾的相对路径写法
            // 获得了要替换的新的字符串之后，正则替换之
            newDataMainContent = dataMainContent.replace(reg, function (p, $1, $2, $3, $4) {
                /**
                 * dataMainObj.dataMainUrl为data-main文件在html中script标签的data-main属性值，它已经是相对html而言的路径了；
                 * 而如果要使用带.js的config.js引用，则该地址要么也是相对html而言，要么是绝对地址。
                 *
                 * 相对地址由util.getNormalizeUrl(dataMainObj.dataMainUrl, $2);来计算获得。
                 *
                 * TODO 绝对地址是在相对地址的基础上进行计算的，不同的系统绝对地址不一样，这个必须从options传递进来，待完善，可提供一个函数
                 * 但这也不是必须的，如果data-main指定的是绝对地址，util.getNormalizeUrl计算之后也是绝对地址
                 */

                newConfigInPageUrl = util.getNormalizeUrl(dataMainObj.dataMainUrl, $2);
                if (!path.extname(newConfigInPageUrl)) {
                    newConfigInPageUrl = newConfigInPageUrl + '.js';
                }

                return $1 + util.getSuffixUrl(newConfigInPageUrl, configJsObj.appendStr) + $4;
            });
        }

        dataMainSavePath = dataMainObj.filePath;
    }

    // 保存
    grunt.file.write(dataMainSavePath, newDataMainContent);
};
