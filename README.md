# grunt-htmlstamp

> deal with html for js or css link
本插件最终生成结果将覆盖原html文件

如果找不到js或者css，则不会进行修改

后缀模式：时间戳和MD5值。

时间戳模式比较好处理，注意排除绝对URL情况。

MD5模式，测试sha1和md5方式的区别。选择该方式时要生成一个json文件，这样避免同一文件在不同页面时被重复计算md5值。

如果js文件被压缩，但页面中源代码引用的是其非压缩版本，则需要提供一个方法来匹配压缩版和非压缩版。

对压缩版文件md5之后，要生成一份新的文件

inline模式，将代码嵌入到页面中。

replace模式，需要传递替换对应表，然后对相应文件进行替换

要同时支持不同模式的组合

## Getting Started
This plugin requires Grunt `~0.4.5`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-htmlstamp --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-htmlstamp');
```

## The "htmlstamp" task

### Overview
In your project's Gruntfile, add a section named `htmlstamp` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  htmlstamp: {
    options: {
      // Task-specific options go here.
    },
    your_target: {
      // Target-specific file lists and/or options go here.
    },
  },
});
```

### Options

#### options.separator
Type: `String`
Default value: `',  '`

A string value that is used to do something with whatever.

#### options.punctuation
Type: `String`
Default value: `'.'`

A string value that is used to do something else with whatever else.

### Usage Examples

#### Default Options
In this example, the default options are used to do something with whatever. So if the `testing` file has the content `Testing` and the `123` file had the content `1 2 3`, the generated result would be `Testing, 1 2 3.`

```js
grunt.initConfig({
  htmlstamp: {
    options: {},
    files: {
      'dest/default_options': ['src/testing', 'src/123'],
    },
  },
});
```

#### Custom Options
In this example, custom options are used to do something else with whatever else. So if the `testing` file has the content `Testing` and the `123` file had the content `1 2 3`, the generated result in this case would be `Testing: 1 2 3 !!!`

```js
grunt.initConfig({
  htmlstamp: {
    options: {
      separator: ': ',
      punctuation: ' !!!',
    },
    files: {
      'dest/default_options': ['src/testing', 'src/123'],
    },
  },
});
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
_(Nothing yet)_
