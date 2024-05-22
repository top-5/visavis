import { SceneEvents, emit } from "src/lib/UI/SceneEvents";

export class AudioProcessor {

    private recognitionOn: boolean = false;
    private volumeDetectedTimestamp: number = 0;
    private idleWaitTime = 3000;
    private idlePollingInterval = 1000;
    private mediaSource!: MediaStreamAudioSourceNode;
    private audioContext: AudioContext = new AudioContext();
    private volumeNode!: AudioWorkletNode;
    private recognition!: SpeechRecognition;
    private recognitionLock: boolean = false;

    private audioMonitorWorklet = 'volume-processor.js';
    private audioMonitorProcessor = 'volume-processor';

    public async listenToMicrophone(): Promise<void> {
        console.log('Listening to microphone');
        await this.initAudioProcessing();
        this.setupSpeechRecognition();
    }

    private async addVolumeProcessor(): Promise<AudioWorkletNode> {
        console.log('Adding volume processor');
        await this.audioContext.audioWorklet.addModule(this.audioMonitorWorklet);
        this.volumeNode = new AudioWorkletNode(this.audioContext, this.audioMonitorProcessor, {
            parameterData: {
                threshold: 10
            }
        });
        console.log('Volume node:', this.volumeNode);
        // let threshold = (this.volumeNode.parameters as any).get('threshold');
        // threshold.value = 20;
        return this.volumeNode;
    }

    private async removeVolumeProcessor(): Promise<void> {
        console.log('Removing volume processor');
        this.volumeNode.port.close();
        this.volumeNode.disconnect();
        this.mediaSource.disconnect();
    }

    private async initAudioProcessing(): Promise<void> {
        console.log('Initializing audio processing');
        try {
            const stream = await this.setupMicrophone();
            if (!stream) {
                console.log('Failed to access the microphone');
                return;
            }

            this.mediaSource = this.audioContext.createMediaStreamSource(stream);
            this.audioContext.createMediaStreamDestination();

            await this.addVolumeProcessor();

            this.volumeNode.port.onmessage = (event) => {
                if (event.data.type === 'volume' && event.data.volume) {
                    this.volumeDetectedTimestamp = Date.now();
                    this.startSpeechRecognition();
                }
            };

            this.mediaSource.connect(this.volumeNode).connect(this.audioContext.destination);
            console.log("Started listening to microphone");

            this.audioContext.resume();
            this.volumeNode.port.start();
            console.log('Volume node:', this.volumeNode);
        } catch (err) {
            console.error('Error accessing the microphone:', err);
        }
    }

    private setupSpeechRecognition(): void {
        console.log('Setting up speech recognition');
        const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'en-US';
        this.recognition.continuous = true;
        this.recognition.interimResults = false;

        this.recognition.onaudiostart = () => {
            console.log('Audio started');
        };

        this.recognition.onaudioend = () => {
            console.log('Audio ended');
        };

        this.recognition.onspeechstart = (event: Event) => {
            console.log('Speech detected: ', event);
        };

        this.recognition.onspeechend = () => {
            console.log('Speech ended');
        };

        this.recognition.onsoundstart = () => {
            console.log('Sound detected');
        };

        this.recognition.onsoundend = () => {
            console.log('Sound ended');
        };

        this.recognition.onresult = (event: SpeechRecognitionEvent) => {
            const transcript = event.results[event.resultIndex][0].transcript;
            emit(SceneEvents.SceneControlsVoiceCommand, transcript);
    
            for (let i = 0; i < event.results.length; i++) {
                const result = event.results[i];
                for (let j = 0; j < result.length; j++) {
                    const alternative = result[j];
                    console.log(`RESULT[${i}]: ${alternative.transcript} (Confidence: ${alternative.confidence})`);
                }
            }
        };

        this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Speech Recognition Error:', event.error);
        };

        this.recognition.onend = () => {
            console.log('Speech recognition service disconnected');
            if (this.recognitionOn) {
                this.recognitionOn = false;
                this.startSpeechRecognition();
            }
        };
    }

    private checkVolume(): boolean {
        if (this.volumeDetectedTimestamp > 0) {
            if (Date.now() - this.volumeDetectedTimestamp > this.idleWaitTime) {
                this.stopSpeechRecognition();
                console.log('Speech recognition stopped');
                this.volumeDetectedTimestamp = 0;
                return false;
            }
            return true;
        }
        return false;
    }

    public startSpeechRecognition(): void {
        if (!this.recognitionLock) {
            this.recognitionLock = true;
            if (this.recognition && !this.recognitionOn) {
                this.recognitionOn = true;
                console.log('Starting speech recognition');
                try {
                    this.recognition.start();
                    console.log('Speech recognition started');
                } catch (ex) {
                    console.warn('Error starting speech recognition:', ex);
                }

                const intervalId = setInterval(() => {
                    if (!this.checkVolume()) {
                        console.log("Silence detected, stopped speech recognition");
                        clearInterval(intervalId);
                        this.recognitionOn = false;
                        this.recognitionLock = false;
                    }
                }, this.idlePollingInterval);
            } else {
                this.recognitionLock = false;
            }
        }
    }

    public stopSpeechRecognition(): void {
        console.log('Stopping speech recognition');
        if (this.recognition && this.recognitionOn) {
            this.recognitionOn = false;
            this.recognition.stop();
            console.log('Speech recognition stopped');
        }
        this.recognitionLock = false;
    }

    private async fetchAndSelectMicrophone(): Promise<MediaStream | undefined> {
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });

            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioInputs: DeviceInfo[] = devices
                .filter(device => device.kind === 'audioinput')
                .map(device => ({ label: device.label, deviceId: device.deviceId }));

            console.log('Available microphones:');
            audioInputs.forEach((device, index) => {
                console.log(`${index + 1}: ${device.label} (${device.deviceId})`);
            });

            const selectedDeviceId = "communications";

            return navigator.mediaDevices.getUserMedia({
                audio: { deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined },
                video: false, preferCurrentTab: true
            });

        } catch (error) {
            console.error('Error accessing the microphone:', error);
            return undefined;
        }
    }

    private async setupMicrophone(): Promise<MediaStream | undefined> {
        const stream = await this.fetchAndSelectMicrophone();
        if (stream) {
            console.log('Microphone access granted');
            return stream;
        } else {
            console.log('Failed to access any microphone');
        }
    }
}

export interface DeviceInfo {
    label: string;
    deviceId: string;
}
