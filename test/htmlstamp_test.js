'use strict';

var grunt = require('grunt');

/*
 ======== A Handy Little Nodeunit Reference ========
 https://github.com/caolan/nodeunit

 Test methods:
 test.expect(numAssertions)
 test.done()
 Test assertions:
 test.ok(value, [message])
 test.equal(actual, expected, [message])
 test.notEqual(actual, expected, [message])
 test.deepEqual(actual, expected, [message])
 test.notDeepEqual(actual, expected, [message])
 test.strictEqual(actual, expected, [message])
 test.notStrictEqual(actual, expected, [message])
 test.throws(block, [error], [message])
 test.doesNotThrow(block, [error], [message])
 test.ifError(value)
 */

function checkTimestamp(actual, expected) {
    var actualArr = [],
        expectedArr = [],
        reg = /\_v=(\d+)/gi,
        item;

    while (item = reg.exec(actual)) {
        actualArr.push(item[1] + '');
    }

    while (item = reg.exec(expected)) {
        expectedArr.push(item[1] + '');
    }

    // TODO 此处可以再考虑修改得更严格些
    // 如果匹配的数组个数不一样则失败
    if (actualArr.length !== expectedArr.length) {
        return false;
    }

    return true;
}

exports.htmlstamp = {
    setUp: function (done) {
        // setup here if necessary
        done();
    },
    suffix_time: function (test) {
        test.expect(1);

        var actual = grunt.file.read('tmp/suffix_time.html'),
            expected = grunt.file.read('test/expected/suffix_time.html');

        /*
         * 注意此处的判断应该是下面这种，但它只是抛出异常，因此变通的使用test.equal来处理。
         * test.ifError(!checkTimestamp(actual,expected));
         */
        var tmp1 = actual,
            tmp2 = actual;
        if (!checkTimestamp(actual, expected)) {
            tmp2 = expected;
        }

        test.equal(tmp1, tmp2, 'append in query with timestamp. (Eg. script.js?_v=151106132902)');

        test.done();
    },
    suffix_hash: function (test) {
        test.expect(1);

        var actual = grunt.file.read('tmp/suffix_hash.html'),
            expected = grunt.file.read('test/expected/suffix_hash.html');

        test.equal(actual, expected, 'append in query with hash code. (Eg. script.js?_v=241f131860)');

        test.done();
    },
    embed_time: function (test) {
        test.expect(1);

        var actual = grunt.file.read('tmp/embed_time.html'),
            expected = grunt.file.read('test/expected/embed_time.html');

        /*
         * 注意此处的判断应该是下面这种，但它只是抛出异常，因此变通的使用test.equal来处理。
         * test.ifError(!checkTimestamp(actual,expected));
         */
        var tmp1 = actual,
            tmp2 = actual;
        if (!checkTimestamp(actual, expected)) {
            tmp2 = expected;
        }

        test.equal(tmp1, tmp2, 'append in file name with timestamp. (Eg. script.151106132902.js)');

        test.done();
    },
    embed_hash: function (test) {
        test.expect(1);

        var actual = grunt.file.read('tmp/embed_hash.html'),
            expected = grunt.file.read('test/expected/embed_hash.html');

        test.equal(actual, expected, 'append in file name with hash code. (Eg. script.241f131860.js)');

        test.done();
    },
    inline: function (test) {
        test.expect(1);

        var actual = grunt.file.read('tmp/inline.html'),
            expected = grunt.file.read('test/expected/inline.html'),
            reg = /\r\n\s*/gi;

        // 注意此处要将换行符和空格等都去掉，否则会因为空格数目不一致导致对比失败
        test.equal(actual.replace(reg, ""), expected.replace(reg, ""), 'insert code into html.');

        test.done();
    }
};
