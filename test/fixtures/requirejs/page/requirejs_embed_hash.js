/**
 *
 */
requirejs(['../common/config'], function () {
    requirejs(['widget/msg', 'note', './widget/along', 'outside'], function (msg, note, along, outside) {
        $(function () {
            $("h1").after('<p>' + msg.getName() + ';' + note.getName() + ';' + along.getName() + ';' + outside.getName() + '</p>');
        });
    });
});


