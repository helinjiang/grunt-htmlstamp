/*
 * grunt-htmlstamp
 * https://github.com/helinjiang/grunt-htmlstamp
 *
 * Copyright (c) 2015 helinjiang
 * Licensed under the MIT license.
 */
'use strict';

var cheerio = require('cheerio');
var util = require('../lib/util');
var tool = require('../lib/tool');

function getHash(content, encoding) {
    return util.getHash(content, encoding, 'sha1');
}

module.exports = function (grunt) {

    // Please see the Grunt documentation for more information regarding task
    // creation: http://gruntjs.com/creating-tasks

    grunt.registerMultiTask('htmlstamp', 'deal with html for js or css link', function () {
        // Merge task-specific and/or target-specific options with these defaults.
        var options = this.options({
            type: 'suffix', // 以哪种形式追加，suffix:后缀模式，embed:嵌入模式，inline：内联模式，custom：自定义模式
            appendType: 'time', // 追加什么类型的字符串，time:时间戳形式，hash:hash形式，用于type=suffix和embed模式
            suffixKey: '_v', // 后缀的key，用于type=suffix模式
            hashFunction: getHash, // 当appendType=hash时获得hash值的函数，用于type=suffix和embed模式
            timestampFormat: 'yymmddHHMMss', // 当appendType=time时，设定时间戳的格式
            customAppend: '', // TODO 除了自动生成的时间戳或hash之外，再追加的字符串，例如自定义的版本号等

        });

        // Iterate over all specified file groups.
        this.files.forEach(function (f) {
            /**
             * html实际的文件路径，相对Gruntfile.js的路径
             * @type {String}
             */
            var htmlFilePath = f.dest;

            /**
             * js和css的文件数组
             * @type {Array}
             */
            var fileArr = f.src.filter(function (filepath) {
                // Warn on and remove invalid source files (if nonull was set).
                if (!grunt.file.exists(filepath)) {
                    grunt.log.warn('Source file "' + filepath + '" not found.');
                    return false;
                } else {
                    return true;
                }
            }).map(function (filePath) {

                /**
                 * js和css实际的文件路径，相对Gruntfile.js的路径
                 * @type {String}
                 */
                var jsCssFilePath = filePath;

                /**
                 * 最终要追加的字符串，可能是时间戳或者hash值等
                 * @type {String}
                 */
                var appendStr = tool.getAppendStr(grunt, options, jsCssFilePath);


                /**
                 * js或css文件相对于html文件的路径
                 * @type {String}
                 */
                var filePathInHtml = tool.getPathInHtml(htmlFilePath, jsCssFilePath);

                /**
                 * js物理路径jscssFilePath为：test/fixtures/test1.js，html物理路径htmlFilePath为：test/fixtures/index1.html
                 * js在html中引用的路径filePathInHtml可能为：test1.js或者./test1.js
                 * 如果是后缀模式，后缀值appendStr为：20151105151923，
                 * 则需要将html中的js地址修改为(./)test1.js?_v=20151105151923
                 * 因此针对每一个html中的js文件，需要将(./)xxx.js修改为(./)xxx.js?_v=yyyy
                 * {
                 *  localPath:"test/fixtures/test1.js",
                 *  filePath:"test1.js",
                 *  appendStr:"20151105151923"
                 * }
                 */

                return {
                    localPath: filePath, // 相对于Gruntfile.js的路径
                    filePath: filePathInHtml,// 相对于html的路径
                    appendStr: appendStr
                };
            });

            /**
             * html文件的内容
             * @type {String}
             */
            var htmlContent = grunt.file.read(htmlFilePath);

            /**
             * 用于处理html的类jQuery对象
             * @type {Object}
             */
            var $ = cheerio.load(htmlContent, {
                decodeEntities: false
            });

            /**
             * 新的html内容
             * @type {String}
             */
            var newContent = htmlContent;
            switch (options.type) {
                case 'embed':
                    newContent = tool.getHtmlContentEmbed($, fileArr);
                    tool.copyFileIfEmbed(grunt, fileArr);
                    break;
                case 'inline':
                    newContent = tool.getHtmlContentInline($, fileArr, grunt);
                    break;
                case 'suffix':
                    newContent = tool.getHtmlContentSuffix($, fileArr);
                    break;
                default :
                    newContent = tool.getHtmlContentSuffix($, fileArr);
                    break;
            }

            // 写入dest文件内容
            grunt.file.write(htmlFilePath, newContent);

            // Print a success message.
            grunt.log.writeln('File "' + f.dest + '" created.');
        });
    });

};
