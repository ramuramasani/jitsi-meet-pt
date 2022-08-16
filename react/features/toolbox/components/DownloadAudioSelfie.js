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
        let link;

        this._selfie = () => {
            const videos = document.getElementsByTagName('video');
            let canvas = document.createElement('canvas');

            if (videos.length > 0) {
                canvas.width = 1080;
                canvas.height = 720;

                link = document.createElement("a");
                document.body.appendChild(link); // for Firefox
                selfieTogether(videos, canvas);
            }

        };

        function testCode() {
            const videos = document.getElementsByTagName('audio');
            let toArr = Array.prototype.slice.call(videos, 0);

            let participantVideo;

            function getParticipantAudio() {

                toArr.some((obj) => {
                    if (obj.id.includes('remote')) {
                        participantVideo = obj;
                        return true;
                    }
                    return false;
                });
            }

            getParticipantAudio();

            function arrayRemove(arr, value) {
                return arr.filter(function (ele) {
                    return ele.id.contains(value);
                });
            }

            /*
            *
            * const mediaRecorder = new MediaRecorder(document.getElementsByTagName('audio')[0].captureStream());
    mediaRecorder.start();const audioChunks = [];

    mediaRecorder.addEventListener("dataavailable", event => {
      audioChunks.push(event.data);
    }); mediaRecorder.addEventListener("stop", () => {
      const audioBlob = new Blob(audioChunks);
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl); console.log('Playing stooped');
      audio.play();
    }); setTimeout(() => {
      mediaRecorder.stop();
    }, 7000);
            * */


            if (participantVideo) {
                let filtered = arrayRemove(toArr, "largeVideo");


                clubbedStream.addTrack(filtered[0].captureStream().getAudioTracks())
                const options = {mimeType: "video/webm; codecs=vp9"};
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
                    window.URL.revokeObjectURL(url);
                }


                mediaRecorder.ondataavailable = handleDataAvailable;

                setTimeout(() => {
                    clearInterval(intervalRecord);
                    mediaRecorder.stop();

                }, 5000)

                mediaRecorder.start();


            } else {
                //alert
            }

        }


        function saveBase64AsFile(base64, fileName) {
            link.setAttribute("href", base64);
            link.setAttribute("download", fileName);
            link.click();
        }

        function selfieTogether(videoReceiver, canvas) {
            let toArr = Array.prototype.slice.call(videoReceiver, 0);

            function arrayRemove(arr, value) {
                return arr.filter(function (ele) {
                    return ele.id !== value;
                });
            }

            let participantVideo = null;

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

            if (participantVideo) {
                let filtered = arrayRemove(toArr, "largeVideo");
                for (let i = 0; i < filtered.length; i++) {
                    canvas.getContext('2d')
                        .drawImage(filtered[i], (i) * ((canvas.width) / filtered.length), 0, (canvas.width) / filtered.length, canvas.height);
                }
                let dataURL = canvas.toDataURL("image/png");
                saveBase64AsFile(dataURL, "sample.png");

            } else {
                //alert
            }

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
