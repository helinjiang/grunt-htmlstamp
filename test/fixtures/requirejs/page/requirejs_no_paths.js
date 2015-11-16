/**
 *
 */
requirejs(['../common/confignopaths'], function () {
    requirejs(['widget/note', './widget/along', '../require.js.outside'], function (note, along, outside) {
        console.log(note.getName() + ';' + along.getName() + ';' + outside.getName());
    });
});


