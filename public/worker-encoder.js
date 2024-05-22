importScripts('lame.min.js'); // Include lamejs

self.onmessage = function(event) {
    const { command, buffer } = event.data;
    if (command === 'encode') {
        const mp3encoder = new lamejs.Mp3Encoder(1, 44100, 128); // Mono, 44.1kHz, 128kbps
        const mp3Data = [];
        const samples = new Int16Array(buffer.length);
        for (let i = 0; i < buffer.length; i++) {
            samples[i] = buffer[i] * 32767.5;
        }
        const mp3buf = mp3encoder.encodeBuffer(samples);
        if (mp3buf.length > 0) {
            mp3Data.push(mp3buf);
        }
        const endBuf = mp3encoder.flush();
        if (endBuf.length > 0) {
            mp3Data.push(endBuf);
        }
        self.postMessage({ mp3Data });
    }
};