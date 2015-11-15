# grunt-htmlstamp

> deal with js or css link in html


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

#### options.type
Choices: `'suffix'`, `'embed'`, `'inline'`

Default value: `'suffix'`

确定以哪种形式来处理JS和CSS的URL：

- `'suffix'`：后缀模式，将参数追加到query部分，生成之后的结果类似：`xx.js?_v=[appendStr]`
- `'embed'`：嵌入模式，将参数放入到文件名中，生成之后的结果类似：`xx.[appendStr].js`
- `'inline'`：内联模式，将js或css的源码直接嵌入到html页面里


#### options.appendType
Choices: `'time'`, `'hash'`

Default value: `'time'`

`options.type` 为 `suffix` 和 `inline` 模式时，它们将对URL进行一些处理，需要追加字符串`[appendStr]`，它确定的是“怎么个追加方式”，而 `options.appendType` 则用来确定要“追加什么”：

- `'time'`：要追加的字符串为时间戳，生成之后的结果类似： `test1.js?_v=151107142609` 或 `test1.151107142609.js`
- `'hash'`：要追加的字符串为文件hash值，生成之后的结果类似： `test1.js?_v=cc8f05f977` 或 `test1.cc8f05f977.js`

#### options.timestampFormat
Type: `String`

Default value: `'yymmddHHMMss'`

当 `options.appendType` 为 `time` 时，用于定义时间格式化方式。

#### options.hashFunction
Type: `Function`

Default value: `undefined`

当 `options.appendType` 为 `hash` 时，用于获得hash值的方法。函数将传入两个参数，依次是 `content`（文件内容）和 `encoding`（文件编码）。

默认的核心算法为：

```js
crypto.createHash('sha1').update(content, 'utf8').digest('hex');
```

#### options.shim
Type: `Object`

Default value: `{}`

用于更灵活的控制。key值对应的文件是value值对应的文件的替代者，实际的最后链接地址是value值对应的地址。value值也可以是完整地址，例如：`http://site.com/script.js`。

例如，在html中使用了 `<script src="./test1.js"></script>` ，一种常规的编译之后为 `<script src="./test1.cc8f05f977.js"></script>` ，但在生产环境中，我们可能需要的是压缩版本，也就是 `<script src="./test1.min.js"></script>` ，最终生成 `<script src="./test1.min.cc8f05f977.js"></script>` 。换言之，在编译的时候，我们需要将原html中的test1.js转换为test1.min.js之后，再进行编译。可以配置 `options.shim` 参数为 `{"test1.js":"test1.min.js"}` ，其含义可以理解为原html中的test1.js是test1.min.js的一个别称，最终使用的是test1.min.js。

但要注意以下几点：

- 如果是相对地址，则其相对的是Gruntfile.js而言的地址。如果是完整地址(以http(s)等开头)，则会直接进行替换。
- 键值对中的地址不支持通配符。
- 只有配置了src，且该路径在src中，此处的配置才生效。

#### options.requirejsConfigUrl
Type: `String`

Default value: `''`

针对RequireJS的特别的配置，当该值为有效值时，即启动了RequireJS的特殊配置，该值为配置requirejs.config的文件路径，该路径相对Gruntfile.js而言。

#### options.requirejsBaseUrl
Type: `String`

Default value: `''`

针对RequireJS的特别的配置，当 `options.requirejsConfigUrl` 为有效值时才生效。该值与requirejs.config中的baseUrl作用是一样的，区别在于此处的路径是相对于Gruntfile.js的路径。该值用于在自动处理requirejs.config的 `paths` 值时，计算相对路径。


### Usage Examples

#### 最简单的用法
在原url上追加时间戳是最简单的用法，只需要为每一个目标html页面配置需要处理的js和css即可。注意这里的所有路径都是相对Gruntfile.js而言的，并不是html中的那个路径。

```js
grunt.initConfig({
  htmlstamp: {
    options: {},
    files: {
      'dest/index.html': ['src/test.js', 'src/test.css'],
    },
  },
});
```

执行之后：

```html
<link rel="stylesheet" href="./test1.css?_v=151107142609">
<script type="text/javascript" src="./test1.js?_v=151107142609"></script>
```

#### 支持四种搭配
通过配置 `options.type` 和 `options.appendType` ，可以达到四种不同的编译效果。

```js
grunt.initConfig({
  htmlstamp: {
    suffix_time: {
        files: {
            'tmp/suffix_time.html': ['tmp/test1.js', 'tmp/test1.css']
        }
    },
    suffix_hash: {
        options: {
            appendType: 'hash'
        },
        files: {
            'tmp/suffix_hash.html': ['tmp/test1.js', 'tmp/test1.css']
        }
    },
    embed_time: {
        options: {
            type: 'embed'
        },
        files: {
            'tmp/embed_time.html': ['tmp/test1.js', 'tmp/test1.css']
        }
    },
    embed_hash: {
        options: {
            type: 'embed',
            appendType: 'hash'
        },
        files: {
            'tmp/embed_hash.html': ['tmp/test1.js', 'tmp/test1.css']
        }
    },
  },
});
```

执行之后：

```html
<!--suffix_time-->
<link rel="stylesheet" href="./test1.css?_v=151107142609">
<script type="text/javascript" src="./test1.js?_v=151107142609"></script>

<!--suffix_hash-->
<link rel="stylesheet" href="./test1.css?_v=f8c0db01a0">
<script type="text/javascript" src="./test1.js?_v=cc8f05f977"></script>


<!--embed_time-->
<link rel="stylesheet" href="./test1.151107142609.css">
<script type="text/javascript" src="./test1.151107142609.js"></script>

<!--embed_hash-->
<link rel="stylesheet" href="./test1.f8c0db01a0.css">
<script type="text/javascript" src="./test1.cc8f05f977.js"></script>
```

#### inline模式
有时候需要将引用的js或css文件内容合入到html中，则只需要简单的配置 `options.type` 为 `inline` 即可。

```js
grunt.initConfig({
  htmlstamp: {
    options: {
        type: 'inline'
    },
    files: {
        'tmp/inline.html': ['tmp/test1.js', 'tmp/test1.css']
    }
  },
});
```

#### shim的使用
如果需要对html中的js或css文件进行自定义的替换，则可以使用 `options.shim` 来配置。在下面的例子中，我们使用了 `options.shim` ，例如将test2.js在编译时先替换成test2.min.js再进行后续编译；将testexternal.js替换成一个外部链接。

要更有效理解 `options.shim` 的使用，可以仔细对比下面例子编译之前和编译之后的结果对比。

```js
grunt.initConfig({
  htmlstamp: {
    shim_embed: {
        options: {
            type: 'embed',
            appendType: 'hash',
            shim: {
                'tmp/test2.js': 'tmp/test2.min.js',
                'tmp/test3.js': 'tmp/testshim.js',
                'tmp/testexternal.js': 'http://cdn.bootcss.com/jquery/2.1.4/jquery.min.js'
            }
        },
        files: {
            'tmp/shim_embed.html': [
                'tmp/test1.js',
                'tmp/test2.js',
                'tmp/test3.js',
                'tmp/testexternal.js',
                'tmp/test1.css']
        }
    },
    shim_suffix: {
        options: {
            appendType: 'hash',
            shim: {
                'tmp/test2.js': 'tmp/test2.min.js',
                'tmp/test3.js': 'tmp/testshim.js',
                'tmp/testexternal.js': 'http://cdn.bootcss.com/jquery/2.1.4/jquery.min.js'
            }
        },
        files: {
            'tmp/shim_suffix.html': [
                'tmp/test1.js',
                'tmp/test2.js',
                'tmp/test3.js',
                'tmp/testexternal.js',
                'tmp/test1.css']
        }
    }
  },
});
```

执行之前：

```html
<link rel="stylesheet" href="./test1.css">
<script type="text/javascript" src="./test1.js"></script>
<script type="text/javascript" src="./test2.js"></script>
<script type="text/javascript" src="./test3.js"></script>
<script type="text/javascript" src="./testexternal.js"></script>
<script type="text/javascript"></script>
```

执行之后：

```html
<!--shim_embed-->
<link rel="stylesheet" href="./test1.f8c0db01a0.css">
<script type="text/javascript" src="./test1.cc8f05f977.js"></script>
<script type="text/javascript" src="./test2.min.3cfc4d97d1.js"></script>
<script type="text/javascript" src="./testshim.85255a35eb.js"></script>
<script type="text/javascript" src="http://cdn.bootcss.com/jquery/2.1.4/jquery.min.js"></script>
<script type="text/javascript"></script>

<!--shim_suffix-->
<link rel="stylesheet" href="./test1.css?_v=f8c0db01a0">
<script type="text/javascript" src="./test1.js?_v=cc8f05f977"></script>
<script type="text/javascript" src="./test2.min.js?_v=3cfc4d97d1"></script>
<script type="text/javascript" src="./testshim.js?_v=85255a35eb"></script>
<script type="text/javascript" src="http://cdn.bootcss.com/jquery/2.1.4/jquery.min.js"></script>
<script type="text/javascript"></script>
```
#### 针对RequireJS的特殊配置
如果使用RequireJS来组织代码，则可以通过配置 `option.requirejsConfigUrl` 和 `option.requirejsBaseUrl` 来构建。与常规用法一样，通过 `option.type` 可以有两种类型的用法：

- `suffix`模式，建议用于开发场景，实际的工作：修改html中 `data-main` 的url地址，追加时间戳或md5值，类似 `?v=xxxx`;为 `data-main` 中的js文件中引入的`option.requirejsConfigUrl`地址追加字符串；修改 `option.requirejsConfigUrl` 文件，追加 `urlArgs` 参数（这种方式只支持时间戳）
- `embed`模式，建议用于发布场景，实际的工作：修改html中 `data-main` 的url地址内嵌时间戳或md5值，类似 `xxx.123.js`;为 `data-main` 中的js文件中引入的`option.requirejsConfigUrl`地址内嵌时间戳或md5值；修改 `option.requirejsConfigUrl` 文件，删除 `urlArgs` 参数，同时在 `paths` 中新增或修改对应。

```js
grunt.initConfig({
  htmlstamp: {
    requirejs_embed_hash: { //建议发布场景
        options: {
            type: 'embed',
            appendType: 'hash',
            requirejsConfigUrl: 'tmp/requirejs/common/config.js',
            requirejsBaseUrl: 'tmp/requirejs/'
        },
        files: {
            'tmp/requirejs_embed_hash.html': [
                'tmp/requirejs/page/requirejs_embed_hash.js',
                'tmp/requirejs/widget/note.js',
                'tmp/requirejs/widget/msg.1.1.js',
                'tmp/requirejs/widget/along.js',
                'tmp/require.js.outside.js'
            ]
        }
    },
    requirejs_suffix_time: { //建议开发场景
        options: {
            requirejsConfigUrl: 'tmp/requirejs/common/config2.js',
            requirejsBaseUrl: 'tmp/requirejs/'
        },
        files: {
            'tmp/requirejs_suffix_time.html': [
                'tmp/requirejs/page/requirejs_suffix_time.js',
                'tmp/requirejs/widget/note.js',
                'tmp/requirejs/widget/msg.1.1.js',
                'tmp/requirejs/widget/along.js',
                'tmp/require.js.outside.js'
            ]
        }
    }
  },
});
```

对于上述的 `htmlstamp:requirejs_embed_hash` 任务执行之后，`option.requirejsConfigUrl` 配置文件变化：

```js
// 构建之前
requirejs.config({
    baseUrl: "requirejs",
    urlArgs: "bust=" + (new Date()).getTime(), // 避免缓存之用，生产环境要移除
    paths: {
        jquery: "lib/jquery-1.11.3.min",
        'widget/msg': './widget/msg.1.1', //注释
        'note': 'widget/note', /*注释*/
        outside: '../require.js.outside',
        bootstrap: "//cdn.bootcss.com/bootstrap/3.3.4/js/bootstrap.min",
        "underscore": "http://cdn.bootcss.com/underscore.js/1.8.3/underscore-min",
    },
    shim: {
        "widget/msg": ["jquery"]
    }
});

// 构建之后
requirejs.config({
    baseUrl: "requirejs",
    paths: {
        "jquery": "lib/jquery-1.11.3.min",
        "widget/msg": "widget/msg.1.1.f9707ff6a4",
        "note": "widget/note.0c1af63535",
        "outside": "../require.js.outside.4b55644553",
        "widget/along": "widget/along.46d8676b31",
        "bootstrap": "//cdn.bootcss.com/bootstrap/3.3.4/js/bootstrap.min",
        "underscore": "http://cdn.bootcss.com/underscore.js/1.8.3/underscore-min"
    },
    shim: {
        "widget/msg": ["jquery"]
    }
});
```



## Other
本插件的测试用例中列举了一些用例，可供参考。

## Release History
2015-11-15 v1.1.4 Fix bug.

2015-11-15 v1.1.3 Fix bug.

2015-11-14 v1.1.2 Fix bug. Enable to support `.js` in `data-main`'s script file  with `option.requirejsConfigUrl` for  RequieJS. 

2015-11-13 v1.1.1 Fix bug.

2015-11-13 v1.1.0 Support `option.requirejsConfigUrl` and `option.requirejsBaseUrl` to deal with RequireJS.

2015-11-07 v1.0.2 Fix bug.

2015-11-07 v1.0.1 Fix bug.

2015-11-07 v1.0.0 Support `option.shim` to enable more choice to deal with js or css url.

2015-11-07 v0.2.1 Fix bug.

2015-11-06 v0.2.0 Support `inline` way to insert js or css into html.

2015-11-06 v0.1.0 Support `suffix` and `embed` way to change url where you can append both timestamp or hash code.







