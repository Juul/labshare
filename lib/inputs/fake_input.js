var stream = require('stream');
var util = require('util');

function FakeStream(opts) {
    this.opts = opts || {};
    this.opts.objectMode = true;

    if(!this.opts.interval) {
        this.opts.interval = 1000;
    }

    this._counter = 0;

    this._read = function() {};

    this._generate = function() {

        var datapoint = {
            'source': this.opts.source || 'fake_probe_0',
            time: new Date().getTime(),
            value: ((Math.sin(this._counter / 6) * (Math.random() + 1) / 2) + 1) * 50,
        };

        this._counter += 1;
        if(this._counter >= 100) {
            this._counter = 0;
        }

        this.push(datapoint);
    };

    setInterval(this._generate.bind(this), this.opts.interval);
    FakeStream.super_.call(this, this.opts);
}

util.inherits(FakeStream, stream.Readable);

function FakeInput(opts) {
    this.opts = opts;

    this.init = function(callback) {
        var fs = new FakeStream(this.opts);
        if(callback) {
            callback(null, fs);
        }
        return fs;
    };
};

module.exports = function(opts) {
    return new FakeInput(opts);
};