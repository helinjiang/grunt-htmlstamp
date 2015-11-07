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

ȷ����������ʽ������JS��CSS��URL��

- `'suffix'`����׺ģʽ��������׷�ӵ�query���֣�����֮��Ľ�����ƣ�`xx.js?_v=[appendStr]`
- `'embed'`��Ƕ��ģʽ�����������뵽�ļ����У�����֮��Ľ�����ƣ�`xx.[appendStr].js`
- `'inline'`������ģʽ����js��css��Դ��ֱ��Ƕ�뵽htmlҳ����


#### options.appendType
Choices: `'time'`, `'hash'`
Default value: `'time'`

`options.type` Ϊ `suffix` �� `inline` ģʽʱ�����ǽ���URL����һЩ������Ҫ׷���ַ���`[appendStr]`����ȷ�����ǡ���ô��׷�ӷ�ʽ������ `options.appendType` ������ȷ��Ҫ��׷��ʲô����

- `'time'`��Ҫ׷�ӵ��ַ���Ϊʱ���������֮��Ľ�����ƣ� `test1.js?_v=151107142609` �� `test1.151107142609.js`
- `'hash'`��Ҫ׷�ӵ��ַ���Ϊ�ļ�hashֵ������֮��Ľ�����ƣ� `test1.js?_v=cc8f05f977` �� `test1.cc8f05f977.js`

#### options.timestampFormat
Type: `String`
Default value: `'yymmddHHMMss'`

�� `options.appendType` Ϊ `time` ʱ�����ڶ���ʱ���ʽ����ʽ��

#### options.hashFunction
Type: `Function`
Default value: `undefined`

�� `options.appendType` Ϊ `hash` ʱ�����ڻ��hashֵ�ķ������������������������������� `content`���ļ����ݣ��� `encoding`���ļ����룩��

Ĭ�ϵĺ����㷨Ϊ��

```js
crypto.createHash('sha1').update(content, 'utf8').digest('hex');
```

#### options.shim
Type: `Object`
Default value: `{}`

���ڸ����Ŀ��ơ�keyֵ��Ӧ���ļ���valueֵ��Ӧ���ļ�������ߣ�ʵ�ʵ�������ӵ�ַ��valueֵ��Ӧ�ĵ�ַ��valueֵҲ������������ַ�����磺`http://site.com/script.js`��

���磬��html��ʹ���� `<script src="./test1.js"></script>` ��һ�ֳ���ı���֮��Ϊ `<script src="./test1.cc8f05f977.js"></script>` ���������������У����ǿ�����Ҫ����ѹ���汾��Ҳ���� `<script src="./test1.min.js"></script>` ���������� `<script src="./test1.min.cc8f05f977.js"></script>` ������֮���ڱ����ʱ��������Ҫ��ԭhtml�е�test1.jsת��Ϊtest1.min.js֮���ٽ��б��롣�������� `options.shim` ����Ϊ `{"test1.js":"test1.min.js"}` ���京��������Ϊԭhtml�е�test1.js��test1.min.js��һ����ƣ�����ʹ�õ���test1.min.js��

��Ҫע�����¼��㣺

- �������Ե�ַ��������Ե���Gruntfile.js���Եĵ�ַ�������������ַ(��http(s)�ȿ�ͷ)�����ֱ�ӽ����滻��
- ��ֵ���еĵ�ַ��֧��ͨ�����
- ֻ��������src���Ҹ�·����src�У��˴������ò���Ч��



### Usage Examples

#### ��򵥵��÷�
��ԭurl��׷��ʱ�������򵥵��÷���ֻ��ҪΪÿһ��Ŀ��htmlҳ��������Ҫ�����js��css���ɡ�ע�����������·���������Gruntfile.js���Եģ�������html�е��Ǹ�·����

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

ִ��֮��

```html
<link rel="stylesheet" href="./test1.css?_v=151107142609">
<script type="text/javascript" src="./test1.js?_v=151107142609"></script>
```

#### ֧�����ִ���
ͨ������ `options.type` �� `options.appendType` �����Դﵽ���ֲ�ͬ�ı���Ч����

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

ִ��֮��

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

#### inlineģʽ
��ʱ����Ҫ�����õ�js��css�ļ����ݺ��뵽html�У���ֻ��Ҫ�򵥵����� `options.type` Ϊ `inline` ���ɡ�

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

#### shim��ʹ��
�����Ҫ��html�е�js��css�ļ������Զ�����滻�������ʹ�� `options.shim` �����á�������������У�����ʹ���� `options.shim` �����罫test2.js�ڱ���ʱ���滻��test2.min.js�ٽ��к������룻��testexternal.js�滻��һ���ⲿ���ӡ�

Ҫ����Ч��� `options.shim` ��ʹ�ã�������ϸ�Ա��������ӱ���֮ǰ�ͱ���֮��Ľ���Աȡ�

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

ִ��֮ǰ��

```html
<link rel="stylesheet" href="./test1.css">
<script type="text/javascript" src="./test1.js"></script>
<script type="text/javascript" src="./test2.js"></script>
<script type="text/javascript" src="./test3.js"></script>
<script type="text/javascript" src="./testexternal.js"></script>
<script type="text/javascript"></script>
```

ִ��֮��

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


## Other
������Ĳ����������о���һЩ�������ɹ��ο���

## Release History
2015-11-06 v0.1.0 Support `suffix` and `embed` way to change url where you can append both timestamp or hash code.

2015-11-06 v0.2.0 Support `inline` way to insert js or css into html.

2015-11-07 v0.2.1 Fix bug.

2015-11-07 v1.0.0 Support `option.shim` to enable more choice to deal with js or css url.

2015-11-07 v1.0.1 Fix bug.
