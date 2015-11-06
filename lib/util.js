/**
 * [文件描述]
 *
 * @author linjianghe
 * @date 2015/11/6
 */
var crypto = require('crypto');
var cheerio = require('cheerio');
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
exports.unixify = function(filePath) {
    return filePath.split('\\').join('/');
};
