
var JSONStream = require('json-stream');
var SerialPort = require('serialport').SerialPort;

var SerialInput = function(opts) {
    this.opts = opts;

    this.debug = function(msg) {
        if(!this.opts.debug) return;
        console.log("DEBUG: " + msg);
    };

    this.init = function(callback) {
        
        debug("Opening serial device: " + this.args.device);

        this.serial = new SerialPort(this.opts.device, opts, false);
        
        this.serial.open(function(err) {
            if(!err) {
                this.debug("Serial port open");
            }
            this.outStream = new JSONStream();
            this.serial.pipe(this.outStream);

            callback(err, this.outStream);
        }.bind(this))
    };
};


module.exports = function(opts) {
    return new SerialInput(opts);
};