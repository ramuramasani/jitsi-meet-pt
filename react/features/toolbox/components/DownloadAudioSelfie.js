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


        this._selfie = () => {
            if (!boolRecording) {
                boolRecording = true;
                // get Stream from Tracks
                let audioStreams = getStreamFromTracks();
                startRecording(audioStreams);
            } else { // Stop Recording
                boolRecording = false;
                saveRecording()
            }
        };

        function startRecording(audioStreams) {
            const audCtx = new AudioContext();
            let audioDestinationNode = new MediaStreamAudioDestinationNode(audCtx);

            function createAudioNodes(stream) {
                audCtx.createMediaStreamSource(stream).connect(audioDestinationNode)
            }

            audioStreams.forEach(createAudioNodes)

            let audioChunks = [];

            mediaRecorder = new MediaRecorder(audioDestinationNode.stream);

            mediaRecorder.addEventListener("dataavailable", event => {
                console.log('Data Available ', event);
                audioChunks.push(event.data);
            });

            mediaRecorder.addEventListener("stop", () => {
                console.log('Playing stooped ', audioChunks);
                const audioBlob = new Blob(audioChunks, {'type': 'audio/webm; codecs=opus'});
                const audioUrl = URL.createObjectURL(audioBlob);
                console.log('AudioUrl, ', audioUrl);

                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = audioUrl;
                a.download = `${getFilename()}.webm`;
                document.body.appendChild(a);

                a.onclick = () => {
                    console.log(`${a.download} save option shown`);
                    setTimeout(() => {
                        console.log("SetTimeOut Called");
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(audioUrl);
                    }, 2000);
                };
                a.click();
            });

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

            mediaRecorder.start();
        }

        function saveRecording() {
            mediaRecorder.stop();
        }

        function filterStreamsByMediaType(arr, value) {
            return arr.filter(function (ele) {
                console.log(`Filtering ${value} this element is ${ele.jitsiTrack.type} `)
                return ele.jitsiTrack.type === value;
            }).map(function (ele) {
                return ele.jitsiTrack.stream;
            });
        }

        function getStreamFromTracks() {
            let tracks = APP.store.getState()['features/base/tracks'];

            let valueToFilter = 'audio';
            let audioStreams = filterStreamsByMediaType(tracks, valueToFilter);

            console.log(`${valueToFilter} streams length ${audioStreams.length}`);

            return audioStreams;

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
