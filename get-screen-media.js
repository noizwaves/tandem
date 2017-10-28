// const getUserMedia = (
//     window.navigator.getUserMedia ||
//     window.navigator.webkitGetUserMedia ||
//     window.navigator.mozGetUserMedia ||
//     window.navigator.msGetUserMedia
// ).bind(window.navigator);

const desktopCapturer = require('electron').desktopCapturer;


module.exports = function() {
    return function(cb) {
        desktopCapturer.getSources({types: ['window', 'screen']}, function (error, sources) {
            if (error) throw error
            for (var i = 0; i < sources.length; ++i) {
                if (sources[i].name === 'Entire screen') {
                    navigator.mediaDevices.getUserMedia(
                        {
                            audio: false,
                            video: {
                                mandatory: {
                                    chromeMediaSource: 'desktop',
                                    chromeMediaSourceId: sources[i].id,
                                    maxWidth: screen.width,
                                    maxHeight: screen.height,
                                    minFrameRate: 30
                                }
                            }
                        },
                        cb
                    ).then(function(stream) {
                        cb(stream)
                    })
                        .catch(function(err) {
                            console.error('getUserMedia', err);
                        })
                }
            }
        })
    }
}

