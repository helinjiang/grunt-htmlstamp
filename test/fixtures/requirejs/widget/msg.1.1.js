/**
 * [文件描述]
 *
 * @author helinjiang
 * @date 2015/11/11
 */

define(function(){
    return {
        getName:function(){
            var title = $("title").text();
            return "I am in msg.js get title=" + title;
        }
    }
});