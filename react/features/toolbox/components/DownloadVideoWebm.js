const videos = document.getElementsByTagName('video');
let canvas = document.createElement('canvas');
let toArr = Array.prototype.slice.call(videos, 0);

let participantVideo;

function getParticipantVideo() {

    toArr.some((obj) => {
        if (obj.id.includes('remote')) {
            participantVideo = obj;
            return true;
        }
        return false;
    });
}

getParticipantVideo();

function arrayRemove(arr, value) {
    return arr.filter(function (ele) {
        return ele.id !== value;
    });
}

function paintCanvas(filtered) {
    for (let i = 0; i < filtered.length; i++) {
        canvas.getContext('2d')
            .drawImage(filtered[i], (i) * ((canvas.width) / filtered.length), 0, (canvas.width) / filtered.length, canvas.height);
    }
}

let intervalRecord;

if (participantVideo) {
    let filtered = arrayRemove(toArr, "largeVideo");
    console.log('Filtered ', filtered);
    intervalRecord = setInterval(() => paintCanvas(filtered), 30);

    let clubbedStream = canvas.captureStream();
    console.log(clubbedStream.getTracks())
    console.log(clubbedStream.getAudioTracks())
    console.log(clubbedStream.getVideoTracks())

    //  clubbedStream.addTrack(filtered[0].captureStream().getAudioTracks())
    const options = {mimeType: "video/webm"};
    let recordedChunks = [];

    let mediaRecorder = new MediaRecorder(clubbedStream, options);

    function handleDataAvailable(event) {
        console.log("data-available");
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
            console.log(recordedChunks);
            download();
        } else {
            // …
            console.log('event.data.size is ', event.data.size)
        }
    }

    function download() {
        const blob = new Blob(recordedChunks, {
            type: "video/webm"
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
        a.href = url;
        a.download = "test.webm";
        a.click();
        // window.URL.revokeObjectURL(url);
    }


    mediaRecorder.ondataavailable = handleDataAvailable;

    setTimeout(() => {
        mediaRecorder.stop();
        clearInterval(intervalRecord);

    }, 5000)

    mediaRecorder.start();


} else {
    //alert
}

