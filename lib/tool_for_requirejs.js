/**
 * [文件描述]
 *
 * @author helinjiang
 * @date 2015/11/13
 */

var util = require('./util');

/**
 * 获得config.js中
 * @param {String} configContent config.js的内容，建议是无注释版本的内容
 * @param {RegExp} regPathsStr 用于匹配paths的正则表达式
 * @returns {{map: {}, mapExternal: {}}}
 */
exports.getPathsObj = function (configContent, regPathsStr) {
    var pathsStr = configContent.match(regPathsStr)[0].replace(/[\r\n]/g, '').replace(/\s+/g, ' '),
        regPathParamStr = /paths\s*:\s*\{\s*(.*,?)*\s*\}/,
        pathParamStr = pathsStr.match(regPathParamStr)[1],
        pathParamArr = pathParamStr.split(',');

    //console.log(pathParamArr);

    // 区分外部链接和相对链接，如果是外部连接，则不进行处理
    var map = {},
        mapExternal = {},
        regDot = /\'|\"/g;

    pathParamArr.forEach(function (item) {
        if (item.trim() !== "") {
            var tarr = item.split(":"),
                key = tarr.shift().replace(regDot, '').trim(),
                value = tarr.join(":").replace(regDot, '').trim();

            if (!util.isExternalUrl(value)) {
                map[key] = value;
            } else {
                mapExternal[key] = value;
            }
        }
    });

    return {
        map: map,
        mapExternal: mapExternal
    };
};

/**
 * 获取信息，包括新的paths对应的对象、data-main文件对象和config.js文件要追加的字符
 * @param {Object} pathObj
 * @param {Array} fileArr 文件对象数组
 * @param {String} dataMainUrl data-main属性对应的值
 * @param {String} configUrl config.js的路径
 * @param {String} baseUrl 与config.js中的baseUrl是一样的含义，区别在于此处的url是相对Gruntfile.js而言的
 * @returns {{map: {}, dataMainObj: {}, configSavePathAppendStr: string}}
 */
exports.getInfo = function (pathObj, fileArr, dataMainUrl, configUrl, baseUrl) {
    var map = pathObj.map,
        mapExternal = pathObj.mapExternal;

    var fMap = {};
    for (var k in map) {
        var v = map[k];
        // 将以"./"开头的路径都去掉这个
        fMap[v.replace(/^\.\//, '')] = k;
    }
    //console.log(fMap);

    var fromUrl = baseUrl + '/test.js',
        dataMainObj,
        configJsObj;

    fileArr.forEach(function (item) {
        if (util.isMatch(item.filePathInHtml, dataMainUrl)) {
            // 如果是data-main中的链接，则不处理，因为它不会在config.js中配置
            dataMainObj = item;
        } else if (configUrl === item.filePath) {
            // 如果是config.js中的链接，也不处理
            configJsObj = item;
        } else {
            var relativeUrl = util.getRelativeUrl(fromUrl, item.filePath),
                relativeUrlName = util.getUrlWithoutExtName(relativeUrl),
                mapK = fMap[relativeUrlName],
                newValue = relativeUrlName + "." + item.appendStr;

            //console.log('+++', mapK, relativeUrlName, newValue);

            // 如果原map中存在该key值，则覆盖，否则新建之
            map[mapK || relativeUrlName] = newValue;
        }
    });

    // 合并绝对路径和相对路径的map
    for (var s in mapExternal) {
        map[s] = mapExternal[s];
    }

    return {
        map: map,
        dataMainObj: dataMainObj,
        configJsObj: configJsObj
    };
};

/**
 * 保存新的config.js文件
 * @param {Object} grunt
 * @param {String} content 原config.js中的内容，建议是移除注释之后的内容
 * @param {RegExp} regPathsStr  用于匹配paths的正则表达式
 * @param {Object} map paths对应的对象
 * @param {String} savePath 新文件保存的路径
 */
exports.saveRequireJSConfig = function (grunt, content, regPathsStr, map, savePath) {
    // 将新的paths替换原config.js文件中的paths
    var newContent = content.replace(regPathsStr, "paths:" + JSON.stringify(map));

    // 移除urlArgs，因为这个参数是在开发场景时才使用
    var urlArgsReg = /urlArgs\s*:.*,/g;
    newContent = newContent.replace(urlArgsReg, '');

    // 保存
    grunt.file.write(savePath, newContent);
};


/**
 * 保存新的data-main文件
 * @param {Object} grunt
 * @param {Object} dataMainObj data-main的文件对象
 * @param {Object} configJsObj config.js的文件对象
 * @param {String} type 类型
 */
exports.saveRequireJSDataMain = function (grunt, dataMainObj, configJsObj, type) {
    // 用于在data-main文件中匹配config.js的字符串
    var configInPageUrl = util.getRelativeUrl(dataMainObj.filePath, configJsObj.filePath),
        configInPageUrlName = util.getUrlWithoutExtName(configInPageUrl),
        newConfigInPageUrl,
        dataMainSavePath;

    if (type === 'embed') {
        newConfigInPageUrl = util.getEmbedUrl(configInPageUrlName, configJsObj.appendStr);

        // 由于在此之前dataMainPath文件已经被重命名了，因此这里要修改的已经被重命名的那个文件，而不是原始文件，
        // 但此处也将有一个小的缺憾，就是再次修改了data-main的文件，其MD5值已经不是现在文件名中的那个值，但也应该无关紧要了。
        dataMainSavePath = util.getEmbedUrl(dataMainObj.filePath, dataMainObj.appendStr);
    } else {
        newConfigInPageUrl = util.getSuffixUrl(configJsObj.filePathInHtml, configJsObj.appendStr);
        dataMainSavePath = dataMainObj.filePath;
    }

    // 获得了要替换的新的字符串之后，正则替换之
    var reg = new RegExp('(require.*?\\(.*\\[\\s*.*[\'\"]\\s*)(' + configInPageUrlName + '(.js)?)(\\s*[\'\"].*\\])', 'g'),
        dataMainContent = grunt.file.read(dataMainObj.filePath);

    dataMainContent = dataMainContent.replace(reg, function (p, $1, $2, $3, $4) {
        return $1 + newConfigInPageUrl + $4;
    });

    // 保存
    grunt.file.write(dataMainSavePath, dataMainContent);
};
