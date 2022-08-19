document.getElementById('layout_wrapper').style.height = '70%'
let reactDemo = document.getElementById('react');
let audioDemo = document.createElement('audio');
let btnDemo = document.createElement('button');
btnDemo.innerHTML = 'Click me to Test Selfie from Javascript and wait for 7 seconds';
btnDemo.style.height = '50px';
btnDemo.style.fontSize = '1.3em'
audioDemo.controls = 'controls';
reactDemo.parentNode.insertBefore(btnDemo, reactDemo);
reactDemo.parentNode.insertBefore(audioDemo, btnDemo);

btnDemo.addEventListener("click", (e) => {
    const audCtx = new AudioContext();
    let jitsiTrackDemo = APP.store.getState()['features/base/tracks'][0].jitsiTrack;
    let streamDemo = jitsiTrackDemo.stream;
    console.log('You have ', APP.store.getState()['features/base/tracks'].length, ' Jitsi Tracks(s)');
    console.log('JitsiTrackDemo is audio JitsiTrack ', streamDemo.mediaType === 'audio', streamDemo);
    const audNodDemo = audCtx.createMediaStreamSource(streamDemo);
    const audioChunksDemo = [];
    let destDemo = new MediaStreamAudioDestinationNode(audCtx);
    const mediaRecorderDemo = new MediaRecorder(destDemo.stream);
    audNodDemo.connect(destDemo);

    mediaRecorderDemo.addEventListener("dataavailable", event => {
        console.log('Data Available ', event);
        audioChunksDemo.push(event.data);
    });

    mediaRecorderDemo.addEventListener("stop", () => {
        console.log('Playing stooped ', audioChunksDemo);
        const audioBlobDemo = new Blob(audioChunksDemo, {'type': 'audio/ogg; codecs=opus'});
        const audioUrlDemo = URL.createObjectURL(audioBlobDemo);
        console.log('AudioUrl, ', audioUrlDemo);
        audioDemo.src = audioUrlDemo;
        audioDemo.play();
    });

    mediaRecorderDemo.start();
    setTimeout(() => {
        mediaRecorderDemo.stop();
    }, 7000);
});

