async function init() {
    // Load the Audio Worklet
    const audioContext = new AudioContext();
    await audioContext.audioWorklet.addModule('volume-processor.js');

    const sharedBuffer = new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * 1024);
    const sharedArray = new Float32Array(sharedBuffer);

    // Initialize VolumeProcessor
    const volumeNode = new AudioWorkletNode(audioContext, 'volume-processor', {
        outputChannelCount: [1]
    });

    volumeNode.port.postMessage({ command: 'init', sharedBuffer, sharedBufferIndex: 0 });

    // Create a Web Worker for MP3 encoding
    const worker = new Worker('worker.js');

    worker.onmessage = (event) => {
        const { mp3Data } = event.data;
        // Handle the MP3 data, e.g., save to server, download, etc.
    };

    volumeNode.port.onmessage = (event) => {
        const { buffer } = event.data;
        if (buffer) {
            worker.postMessage({ command: 'encode', buffer });
        }
    };

    // Get user media and connect to the audio graph
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(volumeNode).connect(audioContext.destination);
}

init();
