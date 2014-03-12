var stream = require('stream');
var events = require('events');
var util = require('util');
var async = require('async');
var merge = require('./merge_stream.js');


/*
  Usage:

  var inputter = Inputter(
    FakeInput({interval: 2000}),
    SerialInput({
      device: "/dev/ttyUSB0",
      baudrate: 9600
    });
  );

  inputter.init(function(err, source) {
    if(err) { console.log("Error: " + err); }

    inputter.getSources(function(streamName) {
      // will be called once every time a new stream appears
    });

    // get a stream for the named source
    inputter.getStream('fake_probe_0');

*/

function FilterStream(sourceNames) {
    if(!sourceNames) return;
    if(!(sourceNames instanceof Array)) {
        if(typeof sourceNames == 'string') {
            sourceNames = [sourceNames];
        } else {
            sourceNames = [].slice.call(arguments);
        }
    }
    this.sourceNames = sourceNames;

    this._transform = function(data, encoding, callback) {
        if(this.sourceNames.indexOf(data.source) > -1) {
            this.push(data);
        }
        callback();
    };

    stream.Transform.call(this, {objectMode: true});
}

util.inherits(FilterStream, stream.Transform);

function Inputter(inputs) {
    if(!inputs) return;
    this.inputs = [].slice.call(arguments)
    this.debug = function(msg) {
        if(!this.opts.debug) return;
        console.log("DEBUG: " + msg);
    };

    this.init = function(callback) {
        this.sources = [];
        // call init functions of all inputs
        // one after the other
        async.series(this.inputs.map(function(input) {
            return input.init.bind(input);
        }), function(err, streams) {
            if(err) {callback(err); return;}
            this.streams = streams;
            // merge all streams into a single stream
            this.stream = merge(streams);
            
            this.stream.on('data', function(data) {
                if(!data.source) return;
                if(this.sources.indexOf(data.source) > -1) {
                    this.sources.push(data.source);
                    this.emit('source', data.source);
                }
            }.bind(this));
            callback(err, this.stream);
        }.bind(this));
    };
    
    // if onlyOnce is true, 
    // then the callback will be called only once
    // if it is not true,
    // then the callback witl be bound to .on('source')
    this.getSources = function(callback, onlyOnce) {
        callback(this.sources);
        if(!onlyOnce) {
            this.on('source', callback);
        }
    };

    // return a stream with only the source(s) named
    this.getStream = function(sourceNames) {
        if(typeof sourceNames == 'string') {
            sourceNames = [sourceNames];
        } else {
            sourceNames = [].slice.call(arguments);
        }
        var fstream = new FilterStream(sourceNames);
        this.stream.pipe(fstream);
        return fstream;
    };

};

util.inherits(Inputter, events.EventEmitter);

module.exports = Inputter;