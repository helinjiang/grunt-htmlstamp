//The build will inline common dependencies into this file.

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
