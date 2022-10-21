// @flow

import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import type { AbstractButtonProps } from '../../../base/toolbox/components';
import { AbstractSelfieButton } from '../../../base/toolbox/components';
import { toggleRecordTimer } from '../../actions.any';
import {
    NOTIFICATION_TIMEOUT_TYPE,
    NOTIFICATION_TYPE,
    SALESFORCE_LINK_NOTIFICATION_ID,
    showNotification
} from '../../../notifications';
import { isLocalTrackMuted } from '../../../base/tracks';
import { MEDIA_TYPE } from '../../../base/media';
import { isAudioMuteButtonDisabled } from '../../functions.any';
import { AUDIO_MUTE_BUTTON_ENABLED, getFeatureFlag } from '../../../base/flags';
import {
    isIosMobileBrowser,
    isMobileBrowser
} from '../../../base/environment/utils';

/**
 * The type of the React {@code Component} props of {@link DownloadButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function,

    /**
     * Whether audio is currently muted or not.
     */
    _audioMuted: boolean,
};

/**
 * Implements an {@link AbstractSelfieButton} to open the user documentation in a new window.
 */

    ///This class is used download Audio Recorder
class DownloadAudioRecorder extends AbstractSelfieButton<Props, *> {
    _audioRecorder: Function;
    accessibilityLabel = 'toolbar.accessibilityLabel.selfie';
    label = 'toolbar.selfie';
    tooltip = 'Audio Recorder';

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

        function getMimeType() {
            console.log('isiOSMobile ', isIosMobileBrowser(), ' android&webm ', getMimeTypeForWeb());
            return isIosMobileBrowser() ? 'mp4' : getMimeTypeForWeb();
        }

        function getMimeTypeForWeb() {
            let isChromium = window.chrome;
            let winNav = window.navigator;
            let vendorName = winNav.vendor;
            let isIOSChrome = winNav.userAgent.match('CriOS');

            if (isIOSChrome) {
                // is Google Chrome on IOS
                return 'webm';
            } else if (
                isChromium !== null &&
                typeof isChromium !== 'undefined' &&
                vendorName === 'Google Inc.'
            ) {
                return 'webm';
                // is Google Chrome
            } else {
                return 'mp4';
                // not Google Chrome
            }
        }


        this._audioRecorder = () => {
            console.log('AudioStatus', this._isAudioMuted());
            let audioStreams = getAudioStreamFromTracks();
            if (!boolRecording) {
                if (audioStreams.length > 1) {
                    if (this._isAudioMuted() === false) {
                        this.props.dispatch(toggleRecordTimer());
                        boolRecording = true;
                        // get Stream from Tracks
                        startAudioRecording(audioStreams);
                    } else {
                        props.dispatch(showNotification({
                            titleKey: 'Turn on audio to start recording',
                            uid: SALESFORCE_LINK_NOTIFICATION_ID,
                            appearance: NOTIFICATION_TYPE.NORMAL
                        }, NOTIFICATION_TIMEOUT_TYPE.SHORT));
                    }
                } else {
                    props.dispatch(showNotification({
                        titleKey: 'There is no other participants to record audio',
                        uid: SALESFORCE_LINK_NOTIFICATION_ID,
                        appearance: NOTIFICATION_TYPE.NORMAL
                    }, NOTIFICATION_TIMEOUT_TYPE.SHORT));
                }
            } else {
                boolRecording = false;
                this.props.dispatch(toggleRecordTimer());
                saveAudioRecording();
            }
        };

        function startAudioRecording(audioStreams) {
            const audCtx = new AudioContext();
            let audioDestinationNode = new MediaStreamAudioDestinationNode(audCtx);

            function createAudioNodes(stream) {
                audCtx.createMediaStreamSource(stream)
                    .connect(audioDestinationNode);
            }

            audioStreams.forEach(createAudioNodes);

            let audioChunks = [];

            mediaRecorder = new MediaRecorder(audioDestinationNode.stream);

            mediaRecorder.addEventListener('dataavailable', event => {
                console.log('Data Available ', event);
                console.log('Blob Type ', event.data.type);
                console.log('Data Size ', event.data.size);
                audioChunks.push(event.data);
            });

            mediaRecorder.addEventListener('stop', () => {
                console.log('Playing stooped ', audioChunks);

                if (isMobileBrowser()) {
                    let audioFileReader = new FileReader();
                    let base64data;
                    audioFileReader.onloadend = function() {
                        base64data = audioFileReader.result;
                        console.log('base64data', base64data);

                        if (window.flutter_inappwebview) {
                            let args = base64data;
                            console.log('beforeAudioArgs', args);
                            window.flutter_inappwebview.callHandler('handleAudioArgs', args);
                            console.log('afterAudioArgs', args);
                        }
                    };
                    audioFileReader.readAsDataURL(audioChunks[0]);
                } else {
                    const audioUrl = URL.createObjectURL(audioChunks[0]);
                    console.log('audioUrl ', audioUrl);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = audioUrl;
                    a.download = `${getFilename()}.${getMimeType()}`;
                    document.body.appendChild(a);
                    a.onclick = () => {
                        console.log(`${a.download} save option shown`);
                        setTimeout(() => {
                            console.log('SetTimeOut Called');
                            document.body.removeChild(a);
                            window.URL.revokeObjectURL(audioUrl);
                        }, 2000);
                    };
                    a.click();
                }
            });

            /**
             * Returns a filename based ono the Jitsi room name in the URL and timestamp
             * */
            function getFilename() {
                const now = new Date();
                const timestamp = now.toISOString();
                const room = new RegExp(/(^.+)\s\|/).exec(document.title);
                if (room && room[1] !== '') {
                    return `${room[1]}_${timestamp}`;
                } else {
                    return `polytokRecording_${timestamp}`;
                }
            }

            mediaRecorder.start();
        }

        function saveAudioRecording() {
            mediaRecorder.stop();
        }

        function filterAudioStreamsByMediaType(arr, value) {
            return arr.filter(function(ele) {
                console.log(`Filtering ${value} this element is ${ele.jitsiTrack.type} `);
                return ele.jitsiTrack.type === value;
            })
                .map(function(ele) {
                    return ele.jitsiTrack.stream;
                });
        }

        function getAudioStreamFromTracks() {
            let tracks = APP.store.getState()['features/base/tracks'];

            let valueToFilter = 'audio';
            let audioStreams = filterAudioStreamsByMediaType(tracks, valueToFilter);

            console.log(`${valueToFilter} streams length ${audioStreams.length}`);

            return audioStreams;

        }

    }

    /**
     * Indicates if audio is currently muted or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isAudioMuted() {
        return this.props._audioMuted;
    }

    /**
     * Helper function to perform the download action.
     *
     * @override
     * @protected
     * @returns {void}
     */
    _downloadAudioRecorder() {
        this._audioRecorder();

    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code AudioMuteButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _audioMuted: boolean,
 *     _disabled: boolean
 * }}
 */
function _mapStateToProps(state): Object {
    const _audioMuted = isLocalTrackMuted(state['features/base/tracks'], MEDIA_TYPE.AUDIO);
    const _disabled = isAudioMuteButtonDisabled(state);
    const enabledFlag = getFeatureFlag(state, AUDIO_MUTE_BUTTON_ENABLED, true);

    return {
        _audioMuted,
        _disabled,
        visible: enabledFlag
    };
}

export default translate(connect(_mapStateToProps)(DownloadAudioRecorder));