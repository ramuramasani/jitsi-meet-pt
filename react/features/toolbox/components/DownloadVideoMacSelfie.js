// @flow

import {translate} from '../../base/i18n';
import {connect} from '../../base/redux';
import type {AbstractButtonProps} from '../../base/toolbox/components';
import {AbstractSelfieButton} from "../../base/toolbox/components";

/**
 * The type of the React {@code Component} props of {@link DownloadButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function
};

/**
 * Implements an {@link AbstractSelfieButton} to open the user documentation in a new window.
 */
class DownloadSelfie extends AbstractSelfieButton<Props, *> {
    _selfie: Function;
    accessibilityLabel = 'toolbar.accessibilityLabel.selfie';
    label = 'toolbar.selfie';
    tooltip = 'Selfie';

    /**
     * Handles clicking / pressing the button, and opens a new window with the user documentation.
     *
     * @private
     * @returns {void}
     */
    constructor(props: Props) {
        super(props);
        let boolRecording = false;
        let canvas;
        let mediaRecorder;
        let recordedChunks = [];

        let vidDemo;
        this._selfie = () => {

            if (!boolRecording) {
                document.getElementById('layout_wrapper').style.height = '45%'
                let reactDemo = document.getElementById('react');

                vidDemo = document.createElement('video');

                let canvasDemo = document.createElement('canvas');

                canvas = document.createElement('canvas');


                canvasDemo.style.height = 200
                canvasDemo.style.width = 200
                vidDemo.style.height = 200
                vidDemo.style.width = 200
                vidDemo.playsInline = true
                vidDemo.autoplay = true
                vidDemo.controls = true


                reactDemo.parentNode.insertBefore(canvasDemo, reactDemo);
                reactDemo.parentNode.insertBefore(vidDemo, canvasDemo);


                const videos = document.getElementsByTagName('video');

                if (videos.length > 0) {
                    canvas.style.width = 1080;
                    canvas.style.height = 720;

                    function getStreamFromTracks(mediaType) {
                        let tracks = APP.store.getState()['features/base/tracks'];

                        function filterStreamsByMediaType(arr, value) {
                            return arr.filter(function (ele) {
                                console.log(`Filtering ${value} this element is ${ele.jitsiTrack.type} and is ${ele.jitsiTrack} `)
                                return ele.jitsiTrack.type === value;
                            }).map(function (ele) {
                                return ele.jitsiTrack.stream;
                            });
                        }

                        let arrayMediaStreams = filterStreamsByMediaType(tracks, mediaType);
                        console.log(`${mediaType} streams length ${arrayMediaStreams.length}`);
                        return arrayMediaStreams;
                    }

                    // get Stream from Tracks
                    let arrayAudioStreams = getStreamFromTracks('audio');

                    if (arrayAudioStreams.length > 0) {
                        boolRecording = true;

                        selfieTogether(videos, canvasDemo, canvas, arrayAudioStreams);
                    } else { // warn user - participants must be 2

                    }

                }
            } else {
                boolRecording = false;
                saveRecording()
            }

        };

        function selfieTogether(videoReceiver, canvasDemo, canvas, audioStreams) {

            const audCtx = new AudioContext();
            let audioDestinationNode = new MediaStreamAudioDestinationNode(audCtx);

            function attachAudioSources() {
                function createAudioNodes(stream) {
                    audCtx.createMediaStreamSource(stream).connect(audioDestinationNode)
                }

                audioStreams.forEach(createAudioNodes);
                console.log("AudioDestinationNode Stream Tracks ", audioDestinationNode.stream.getTracks());
                return audioDestinationNode.stream.getTracks();
            }

            let audioStreamTracks = attachAudioSources();
            console.log(`audioStreamTracks ${audioStreamTracks}`)

            let toArr = Array.prototype.slice.call(videoReceiver, 0);

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


            if (participantVideo) {
                let filtered = arrayRemove(toArr, "largeVideo");
                console.log('Filtered ', filtered);
                filtered = arrayRemove(filtered, "");
                console.log('Filtered ', filtered);
                let context2DDemo = canvas.getContext('2d');
                let context2D = canvas.getContext('2d');
                intervalRecord = setInterval(() => {
                    paintCanvas(filtered, context2DDemo);
                    paintCanvas(filtered, context2D);
                }, 30);


                let clubbedStream = canvas.captureStream();
                audioStreamTracks.forEach((track) => clubbedStream.addTrack(track));

                console.log(clubbedStream.getTracks())
                console.log(clubbedStream.getAudioTracks())
                console.log(clubbedStream.getVideoTracks())


                const options = {mimeType: "video/mp4"};
                recordedChunks = [];

                mediaRecorder = new MediaRecorder(clubbedStream, options);

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
                    console.log('Playing stopped ', recordedChunks);

                    const blob = new Blob(recordedChunks, {type: 'video/mp4'});
                    const videoObjectURL = URL.createObjectURL(blob);
                    console.log('VideoUrl, ', videoObjectURL);

                    vidDemo.src = videoObjectURL;
                    vidDemo.play();

                    const a = document.createElement("a");
                    document.body.appendChild(a);
                    a.style = "display: none";
                    a.href = videoObjectURL;
                    a.download = "test.mp4";

                    a.onclick = () => {
                        console.log(`${a.download} save option shown`);
                        setTimeout(() => {
                            console.log("SetTimeOut Called");
                            document.body.removeChild(a);
                            clearInterval(intervalRecord);
                            //  window.URL.revokeObjectURL(videoObjectURL);
                        }, 7000);
                    };

                    a.click();


                }


                mediaRecorder.ondataavailable = handleDataAvailable;

                mediaRecorder.addEventListener("stop", download);

                mediaRecorder.start();

            } else {
                //alert
            }

        }

        function saveRecording() {
            mediaRecorder.stop();
        }


    }

    /**
     * Helper function to perform the download action.
     *
     * @override
     * @protected
     * @returns {void}
     */
    _downloadSelfie() {
        this._selfie()

    }
}

export default translate(connect()(DownloadSelfie));
