// volume-processor.js
class VolumeProcessor extends AudioWorkletProcessor {
    seq = 0;
    buffer_size = 8192; // Adjust size as needed

    static get parameterDescriptors() {
        return [
            { name: 'threshold', defaultValue: 20, minValue: 0, maxValue: 100 },
            { name: 'passthrough', defaultValue: 0, minValue: 0, maxValue: 1 },
            { name: 'recording', defaultValue: 0, minValue: 0, maxValue: 1 },
            { name: 'buffer_size', defaultValue: 8192, minValue: 0, maxValue: 65536},
            /* TODO: implement normalize */
            { name: 'normalize', defaultValue: 0, minValue: 0, maxValue: 1 }
        ];
    }

    constructor() {
        super();
        this.lastVolume = 0;
        this.seq = 0;
        this.bufferSize = this.buffer_size;
        this.buffer = new Float32Array(this.bufferSize);
        this.bufferIndex = 0;

        this.port.onmessage = (event) => {
            if (event.data.type === 'init') {
                this.sharedBuffer = new Float32Array(event.data.sharedBuffer);
            }
        };
    }

    postBuffer() {
        this.port.postMessage({ type: 'buffer', buffer: this.buffer, size: this.bufferIndex });
        this.bufferIndex = 0;
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const output = outputs[0];

        const threshold = parameters.threshold[0] || 60;
        const passthrough = parameters.passthrough[0] || 0;
        const recording = parameters.recording[0] || 0;
        const normalize = parameters.normalize[0] || 0;

        this.seq++;

        if (input.length > 0) {
            const inputData = input[0];
            const outputData = output[0];
            let sum = 0;
            this.bufferIndex = 0;
            for (let i = 0; i < inputData.length; i++) {
                sum += inputData[i] * inputData[i];
                if (passthrough)
                {
                    outputData[i] = inputData[i];  // Pass-through audio
                }
                if (recording)
                {
                    // Save to buffer
                    this.buffer[this.bufferIndex++] = inputData[i];
                    if (this.bufferIndex >= this.bufferSize) {
                        this.postBuffer();
                    }
                }
            }

            if (recording && this.bufferIndex)
            {
                this.postBuffer();
            }

            const rms = Math.sqrt(sum / inputData.length);
            const volume = Math.sqrt(rms) * 100;
            // Post a message back to the main thread if the volume exceeds the threshold
            if (volume > threshold && volume !== this.lastVolume) {
                this.port.postMessage({ type: 'volume', seq: this.seq, volume });
                this.lastVolume = volume;
            }
        }

        return true;
    }
}

registerProcessor('volume-processor', VolumeProcessor);
