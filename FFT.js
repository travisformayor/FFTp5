class FFT {
    constructor(N) {
        this.validateN(N);
        this.N = N;
        this.W = this.precomputeTwiddles();
        this.bitReverseLookup = this.createBitReverseLookup();
    }

    validateN(N) {
        if (N <= 0 || (N & (N - 1)) !== 0) {
            throw new Error('N must be a positive power of 2');
        }
    }

    precomputeTwiddles() {
        const W = new Array(this.N / 2);

        // Following document formula: W_k = e^(-2πik/N) = cos(2πk/N) - i*sin(2πk/N)
        for (let k = 0; k < this.N / 2; k++) {
            const angle = (2 * Math.PI * k) / this.N;
            W[k] = new Complex(
                Math.cos(angle),
                -Math.sin(angle)
            );
        }

        return W;
    }

    createBitReverseLookup() {
        const lookup = new Array(this.N);
        const bits = Math.log2(this.N);

        for (let i = 0; i < this.N; i++) {
            // Convert to binary string padded to correct length
            const binary = i.toString(2).padStart(bits, '0');
            // Reverse bits and convert back to decimal
            const reversed = parseInt(binary.split('').reverse().join(''), 2);
            lookup[i] = reversed;
        }

        return lookup;
    }

    // Parse and evaluate function string at given x
    evaluateFunction(funcStr, x) {
        // Parse the function string into a function
        const withConstants = funcStr
            // Replace pi with the value of Math.PI
            .replace(/\bpi\b/gi, '(' + Math.PI + ')')
            // Replace |x| with Math.abs(x)
            .replace(/\|(.*?)\|/g, 'Math.abs($1)')
            // Add explicit multiplication for adjacent terms
            .replace(/(\d|pi|\))\s*(\(|\|)/g, '$1*$2')  // handle pi(x) -> pi*(x) (also 2(x) & 2|x|)
            .replace(/\)\s*(\w|\|)/g, ')*$1')           // handle sin(x)|x| -> sin(x)*|x|
            .replace(/\|\s*(\w|\()/g, '|*$1');          // handle |x|sin(x) -> |x|*sin(x)
        
        // Replace 'x' strings with x variable
        const evalStr = withConstants
            .replace(/x/g, `(${x})`);
        
        try {
            return eval(evalStr);
        } catch (e) {
            throw new Error(`Invalid function: ${e.message}`);
        }
    }

    generatePoints(funcStr) {
        const x = new Array(this.N);
        const y = new Array(this.N);

        for (let j = 0; j < this.N; j++) {
            x[j] = -Math.PI + (2 * Math.PI * j) / this.N;
            // Store as Complex number (just first param, so real part only)
            y[j] = new Complex(this.evaluateFunction(funcStr, x[j]));
        }

        return { x, y };
    }

    butterflyCompute(input) {
        // Compute complex numbers using butterfly pairs

        // Convert input to array of Complex numbers if necessary
        const signal = Array.isArray(input) ?
            input.map(x => typeof x === 'number' ? new Complex(x) : x) :
            input;

        // Verify input length
        if (signal.length !== this.N) {
            throw new Error(`Input length must be ${this.N}`);
        }

        // Create working array and apply bit reversal
        const X = new Array(this.N);
        for (let i = 0; i < this.N; i++) {
            X[this.bitReverseLookup[i]] = signal[i];
        }

        // Butterfly computation
        for (let stage = 1; stage <= Math.log2(this.N); stage++) {
            const butterflySize = 1 << stage;
            const halfSize = butterflySize >> 1;

            for (let j = 0; j < this.N; j += butterflySize) {
                for (let k = 0; k < halfSize; k++) {
                    const evenIndex = j + k;
                    const oddIndex = j + k + halfSize;
                    const even = X[evenIndex];
                    const odd = X[oddIndex];

                    // twiddle = W[k * N/butterflySize]
                    const twiddleIndex = (k * this.N) / butterflySize;
                    const twiddle = this.W[twiddleIndex % (this.N / 2)];

                    // Butterfly operation
                    const product = Complex.multiply(odd, twiddle);
                    X[evenIndex] = Complex.add(even, product);
                    X[oddIndex] = Complex.subtract(even, product);
                }
            }
        }

        return X;
    }

    // Helper method to compute FFT of a function
    computeFunction(funcStr) {
        const points = this.generatePoints(funcStr);
        // Note: generatePoints returns Complex number objects
        return this.butterflyCompute(points.y);
    }
}
