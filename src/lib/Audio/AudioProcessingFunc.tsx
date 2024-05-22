import { SceneEvents, emit } from "src/lib/UI/SceneEvents";

let recognitionOn: boolean = false;
let volumeDetectedTimestamp: number = 0;

const idleWaitTime = 3000;
const idlePollingInterval = 1000;
let mediaSource: MediaStreamAudioSourceNode;
const audioContext: AudioContext = new AudioContext();
let volumeNode: AudioWorkletNode;

// const audioMonitorWorklet = 'audio-monitor.js';
// const audioMonitorProcessor = 'audio-monitor';
const audioMonitorWorklet = 'volume-processor.js'
const audioMonitorProcessor = 'volume-processor'

async function addVolumeProcessor(): Promise<AudioWorkletNode> {
    console.log('Adding volume processor');
    // Load the worklet processor
    await audioContext.audioWorklet!.addModule(audioMonitorWorklet);
    // Create an instance of AudioWorkletNode
    volumeNode = new AudioWorkletNode(audioContext, audioMonitorProcessor,
        {
            parameterData: {
                threshold: 20
            }
        });
    console.log('Volume node:', volumeNode);
    let threshold = (volumeNode.parameters as any).get('threshold');
    threshold.value = 20;
    return volumeNode;
}

async function removeVolumeProcessor() {
    console.log('Removing volume processor');
    volumeNode.port.close();
    volumeNode.disconnect();
    mediaSource.disconnect();
}

async function initAudioProcessing(): Promise<void> {
    console.log('Initializing audio processing');
    try {
        const stream = await setupMicrophone();
        if (!stream) {
            console.log('Failed to access the microphone');
            return;
        }

        // await navigator.mediaDevices.getUserMedia({ audio: true, video: false, preferCurrentTab: true });
        mediaSource = audioContext.createMediaStreamSource(stream);
        audioContext.createMediaStreamDestination();

        await addVolumeProcessor();

        // Handle messages from the audio worklet
        volumeNode.port.onmessage = (event) => {
            if (event.data.type === 'volume' && event.data.volume) {
                // console.log('Volume:', event.data.volume);
                volumeDetectedTimestamp = Date.now();
                startSpeechRecognition();
            }
            // TODO: Handle other message types
            // - 'buffer' - audio buffer data
            // - 'error' - error messages
        };

        mediaSource.connect(volumeNode).connect(audioContext.destination);
        console.log("Started listening to microphone");

        audioContext.resume();
        volumeNode.port.start();
        console.log('Volume node:', volumeNode);
    } catch (err) {
        console.error('Error accessing the microphone:', err);
    }
}

let recognition: SpeechRecognition;

function setupSpeechRecognition(): void {
    console.log('Setting up speech recognition');
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = false; // true;

    recognition.onaudiostart = () => {
        console.log('Audio started');
    }

    recognition.onaudioend = () => {
        console.log('Audio ended');
    }

    recognition.onspeechstart = (event: Event) => {
        console.log('Speech detected: ', event);
    }

    recognition.onspeechend = () => {
        console.log('Speech ended');
    }

    recognition.onsoundstart = () => {
        console.log('Sound detected');
    }

    recognition.onsoundend = () => {
        console.log('Sound ended');
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[event.resultIndex][0].transcript;
        emit(SceneEvents.SceneControlsVoiceCommand, transcript);
        console.log('RESULT[0]: ', transcript);

        for (let i = 0; i < event.results.length; i++) {
            const result = event.results[i];
            for (let j = 0; j < result.length; j++) {
                const alternative = result[j];
                console.log(`RESULT[${i}]: ${alternative.transcript} (Confidence: ${alternative.confidence})`);
            }
        }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech Recognition Error:', event.error);
    };

    recognition.onend = () => {
        console.log('Speech recognition service disconnected');
        if (recognitionOn) {
            // Restart recognition automatically on ungraceful stop
            recognitionOn = false;
            // Force restart
            startSpeechRecognition();
        }
    };
}

function checkVolume(): boolean {
    if (volumeDetectedTimestamp > 0) {
        if (Date.now() - volumeDetectedTimestamp > idleWaitTime) {
            stopSpeechRecognition();
            console.log('Speech recognition stopped');
            volumeDetectedTimestamp = 0;
            return false;
        }
        return true;
    }
    // Volume not detected
    return false;
}

export function startSpeechRecognition(): void {
    // Implement atomic check

    if (recognition && !recognitionOn) {
        recognitionOn = true;
        console.log('Starting speech recognition');
        try {
            recognition.start();
            console.log('Speech recognition started');
        } catch (ex) {
            // This is likely indicative that it is already running
            console.warn('Error starting speech recognition:', ex);
        }

        const intervalId = setInterval(() => {
            if (!checkVolume()) {
                console.log("Silence detected, stopped speech recognition");
                clearInterval(intervalId);
                recognitionOn = false;
            }
        }, idlePollingInterval);
    }
}

export function stopSpeechRecognition(): void {
    console.log('Stopping speech recognition');
    if (recognition && recognitionOn) {
        recognitionOn = false;
        recognition.stop();
        console.log('Speech recognition stopped');
        // removeVolumeProcessor();
    }
}

export async function listenToMicrophone() {
    console.log('Listening to microphone');
    initAudioProcessing();
    setupSpeechRecognition();
};

// Define interfaces for clarity and type safety
export interface DeviceInfo {
    label: string;
    deviceId: string;
}

// Function to fetch and display available microphones
export async function fetchAndSelectMicrophone(): Promise<MediaStream | undefined> {
    try {
        // Request initial permission to access microphones
        await navigator.mediaDevices.getUserMedia({ audio: true });

        // Then fetch the list of devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs: DeviceInfo[] = devices
            .filter(device => device.kind === 'audioinput')
            .map(device => ({ label: device.label, deviceId: device.deviceId }));

        // Display these devices in a selection dialog (console for this example)
        console.log('Available microphones:');
        audioInputs.forEach((device, index) => {
            console.log(`${index + 1}: ${device.label} (${device.deviceId})`);
        });

        // Prompt user to select a microphone (simplified for this example)
        // const selectedDeviceId = prompt('Enter the device ID of the microphone you want to use:', audioInputs[0].deviceId);
        const selectedDeviceId = "communications";

        // Get the user media with the selected device
        return navigator.mediaDevices.getUserMedia({
            audio: { deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined },
            video: false, preferCurrentTab: true
        });

    } catch (error) {
        console.error('Error accessing the microphone:', error);
        return undefined;
    }
}

// Function to start the process
async function setupMicrophone(): Promise<MediaStream | undefined> {
    const stream = await fetchAndSelectMicrophone();
    if (stream) {
        console.log('Microphone access granted');
        return stream;
        // Do something with the stream, e.g., connect it to an audio context or an HTML audio element
    } else {
        console.log('Failed to access any microphone');
    }
}