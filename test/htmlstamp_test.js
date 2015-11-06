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

exports.htmlstamp = {
    setUp: function (done) {
        // setup here if necessary
        done();
    },
    suffix_time: function (test) {
        test.expect(1);

        var actual = grunt.file.read('tmp/suffix_time.html'),
            expected = grunt.file.read('test/expected/suffix_time.html'),
            actualArr = [],
            expectedArr = [],
            reg = /\_v=(\d+)/gi,
            item;

        while (item = reg.exec(actual)) {
            actualArr.push(item[1] + '');
        }

        while (item = reg.exec(expected)) {
            expectedArr.push(item[1] + '');
        }

        /*
         * 注意此处的判断应该是下面这种，但它只是抛出异常，因此变通的使用test.equal来处理。
         * test.ifError(actual == expected || actual.length != expected.length);
         *
         */
        var tmp1 = actual,
            tmp2 = actual;

        // 如果匹配的数组个数不一样则失败
        if (actualArr.length !== expectedArr.length) {
            tmp2 = expected;
        }

        test.equal(tmp1, tmp2, 'append in query with timestamp. (Eg. script.js?_v=151106132902)');

        test.done();
    },
    suffix_hash: function (test) {
        test.expect(1);

        var actual = grunt.file.read('tmp/suffix_hash.html');
        var expected = grunt.file.read('test/expected/suffix_hash.html');
        test.equal(actual, expected, 'append in query with hash code. (Eg. script.js?_v=241f131860)');

        test.done();
    },
};
