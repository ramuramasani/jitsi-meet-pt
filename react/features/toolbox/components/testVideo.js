document.getElementById('layout_wrapper').style.height = '45%'
let reactDemo = document.getElementById('react');

let btnDemo = document.createElement('button');
let vidDemo = document.createElement('video');

let canvas = document.createElement('canvas');
canvas.style.height = 200
canvas.style.width = 200
vidDemo.style.height = 200
vidDemo.style.width = 200
vidDemo.playsInline = true
vidDemo.autoplay = true
vidDemo.controls = true

btnDemo.innerHTML = 'Click me to Test Selfie from Javascript and wait for 7 seconds';
btnDemo.style.height = '50px';
btnDemo.style.fontSize = '1.3em'

reactDemo.parentNode.insertBefore(btnDemo, reactDemo);
reactDemo.parentNode.insertBefore(canvas, btnDemo);
reactDemo.parentNode.insertBefore(vidDemo, canvas);

btnDemo.addEventListener("click", (e) => {

    const videos = document.getElementsByTagName('video');

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
            console.log('Ele Id ', ele.id);
            return ele.id !== value;
        });
    }

    function paintCanvas(filtered, context2D) {
        for (let i = 0; i < filtered.length; i++) {
            context2D.drawImage(filtered[i], (i) * (canvas.width / filtered.length), 0, canvas.width / filtered.length, canvas.height);
        }
    }

    let intervalRecord;

    if (participantVideo) {
        let filtered = arrayRemove(toArr, "largeVideo");
        console.log('Filtered ', filtered);
        filtered = arrayRemove(filtered, "");
        console.log('Filtered ', filtered);
        let context2D = canvas.getContext('2d');
        intervalRecord = setInterval(() => {
            paintCanvas(filtered, context2D);
        }, 30);

        let clubbedStream = canvas.captureStream();
        console.log(clubbedStream.getTracks())
        console.log(clubbedStream.getAudioTracks())
        console.log(clubbedStream.getVideoTracks())


        const options = {mimeType: "video/mp4"};
        let recordedChunks = [];

        let mediaRecorder = new MediaRecorder(clubbedStream, options);

        function handleDataAvailable(event) {
            console.log("data-available ", event);
            console.log("data-available ", event.data);
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
            const blob = new Blob(recordedChunks, {type: 'video/mp4'});
            const url = URL.createObjectURL(blob);
            vidDemo.src = url;
            vidDemo.play();

            const a = document.createElement("a");
            document.body.appendChild(a);
            a.style = "display: none";
            a.href = url;
            a.download = "test.mp4";
            // a.click();
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

});

