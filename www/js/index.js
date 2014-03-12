
//var browserify = require('browserify');
//var jquery = require('jquery');

var doublebind = require('./lib/doublebind.js');


var binding = doublebind({debug: true}, {
    foo: {
        _template: 'filename.html',
        _controller: function(args) {
            // TODO
            // should be called whenever 
            // this controller is run
        },

        bar: function(el, value) {.
            // The scope is bound to this.
            console.log(value);
        }
    }
});



console.log("Application initialized!");