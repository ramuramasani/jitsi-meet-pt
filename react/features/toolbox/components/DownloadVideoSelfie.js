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
        let mediaRecorder;
        let setIntervalID;
        let canvas;


        this._selfie = () => {

            if (!boolRecording) {

                canvas = document.createElement('canvas');

                function getStreamFromTracks(mediaType) {
                    let tracks = APP.store.getState()['features/base/tracks'];

                    function filterStreamsByMediaType(arr, value) {
                        return arr.filter(function (ele) {
                            console.log(`Filtering ${value} this element is ${ele.jitsiTrack.type} `)
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

                getVideoStreamFromCanvas();
                if (arrayAudioStreams.length > 0) {
                    boolRecording = true;
                    startRecording(arrayAudioStreams);
                } else { // warn user - participants must be 2

                }
            } else { // Stop Recording
                boolRecording = false;
                saveRecording()
            }

        };

        function getVideoStreamFromCanvas() {
            const videosElementsCollection = document.getElementsByTagName('video');
            let videoElementsArray = Array.prototype.slice.call(videosElementsCollection, 0);

            function arrayRemove(arr, value) {
                return arr.filter(function (ele) {
                    return ele.id !== value;
                });
            }

            let filteredVideo = arrayRemove(videoElementsArray, "largeVideo");
            console.log(`Filtered Videos ${filteredVideo}`);

            function clubVideos() {
                function paintCanvas() {
                    for (let i = 0; i < filteredVideo.length; i++) {
                        canvas.getContext('2d')
                            .drawImage(filteredVideo[i], (i) * ((canvas.width) / filteredVideo.length), 0, (canvas.width) / filteredVideo.length, canvas.height);
                    }
                }

                setIntervalID = setInterval(paintCanvas, 30);
            }

            clubVideos();

        }

        function startRecording(audioStreams) {
            const audCtx = new AudioContext();
            let audioDestinationNode = new MediaStreamAudioDestinationNode(audCtx);

            function attachAudioSources() {
                function createAudioNodes(stream) {
                    audCtx.createMediaStreamSource(stream).connect(audioDestinationNode)
                }

                audioStreams.forEach(createAudioNodes);
                return audioDestinationNode.stream.getTracks();
            }

            function prepareRecorder() {
                let recorderChunks = [];

                /**
                 * Returns a filename based ono the Jitsi room name in the URL and timestamp
                 * */
                function getFilename() {
                    const now = new Date();
                    const timestamp = now.toISOString();
                    const room = new RegExp(/(^.+)\s\|/).exec(document.title);
                    if (room && room[1] !== "")
                        return `${room[1]}_${timestamp}`;
                    else
                        return `polytokRecording_${timestamp}`;
                }

                mediaRecorder = new MediaRecorder(mediaStreamToRecord, {mimeType: 'video/webm'});

                mediaRecorder.addEventListener("dataavailable", event => {
                    console.log('Data Available ', event);
                    recorderChunks.push(event.data);
                });

                mediaRecorder.addEventListener("stop", () => {
                    console.log('Playing stooped ', recorderChunks);
                    const videoBlob = new Blob(recorderChunks, {'type': 'video/webm'});
                    const videoObjectURL = URL.createObjectURL(videoBlob);
                    console.log('VideoUrl, ', videoObjectURL);

                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = videoObjectURL;
                    a.download = `${getFilename()}.webm`;
                    document.body.appendChild(a);

                    a.onclick = () => {
                        console.log(`${a.download} save option shown`);
                        setTimeout(() => {
                            console.log("SetTimeOut Called");
                            document.body.removeChild(a);
                            document.body.removeChild(canvas);
                            clearInterval(setIntervalID);
                            window.URL.revokeObjectURL(videoObjectURL);
                        }, 2000);
                    };
                    a.click();
                });
            }

            let audioStreamTracks = attachAudioSources();
            console.log(`audioStreamTracks ${audioStreamTracks}`)
            let videoStreamTracks = canvas.captureStream().getTracks();
            console.log(`videoStreamTracks ${videoStreamTracks}`)
            let mediaStreamToRecord =
                new MediaStream(audioStreamTracks.concat(videoStreamTracks));
            console.log(`MediaStreamToRecord ${mediaStreamToRecord}`);

            prepareRecorder();
            mediaRecorder.start();

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
