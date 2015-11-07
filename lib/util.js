/**
 * 工具
 *
 * @author helinjiang
 * @date 2015/11/6
 */
var crypto = require('crypto');

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
exports.unixify = function(filePath) {
    return filePath.split('\\').join('/');
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
exports.isExternalUrl = function(url) {
    return !!url.match(/^http(s)?:\/\/|^\/\//);
};