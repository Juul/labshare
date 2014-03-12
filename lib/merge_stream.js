var Stream = require('stream').Stream;

/*
  This is from here:
    https://github.com/dominictarr/event-stream/blob/master/index.js#L25-57
*/

function merge(streams) {
    if(!streams) return;
    if(streams instanceof Array) {
        var toMerge = streams;
    } else {
        var toMerge = [].slice.call(arguments)
    }
    var stream = new Stream()
    var endCount = 0
    stream.writable = stream.readable = true
    
    toMerge.forEach(function (e) {
        e.pipe(stream, {end: false})
        var ended = false
        e.on('end', function () {
            if(ended) return
            ended = true
            endCount ++
            if(endCount == toMerge.length)
                stream.emit('end')
        })
    })
    stream.write = function (data) {
        this.emit('data', data)
    }
    stream.destroy = function () {
        merge.forEach(function (e) {
            if(e.destroy) e.destroy()
        })
    }
    return stream;
}

module.exports = merge;