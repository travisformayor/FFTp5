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
            x[j] = -Math.PI + (2 * Math.PI * j) / (this.N);
            // Store as Complex number (just first param, so real part only)
            y[j] = new Complex(this.evaluateFunction(funcStr, x[j]));
        }

        return { x, y };
    }

    // Select the correct pairs for each butterfly round
    getButterflyPairs(stage, N) {
        const distance = N / Math.pow(2, stage); // Distance between pairs decreases with each stage
        const pairs = [];

        // Outer loop: jump by distance*2 to handle next group
        for (let j = 0; j < N; j += distance * 2) {
            // Inner loop: generate pairs within current group
            for (let k = 0; k < distance; k++) {
                const evenIndex = j + k;           // First element in pair
                const oddIndex = j + k + distance; // Second element in pair

                pairs.push({
                    pair: [evenIndex, oddIndex],
                    k: evenIndex,
                    distance: distance
                });
            }
        }

        return pairs;
    }

    // Retrieve the correct twiddle factor, with looping
    getTwiddleFactor(k, butterflySize, N) {
        const twiddleIndex = (k * N) / (2 * butterflySize);
        return this.W[twiddleIndex % (N / 2)];
    }

    // Add new method to expose bit reversal operation
    applyBitReversal(signal) {
        const X = new Array(this.N);
        for (let i = 0; i < this.N; i++) {
            X[i] = signal[this.bitReverseLookup[i]];
        }
        return X;
    }

    // Compute complex numbers using butterfly pairs
    butterflyCompute(input) {
        // Convert input to array of Complex numbers if necessary
        const signal = Array.isArray(input) ?
            input.map(x => typeof x === 'number' ? new Complex(x) : x) :
            input;

        // Verify input length
        if (signal.length !== this.N) {
            throw new Error(`Input length must be ${this.N}`);
        }

        // Use the exposed method for bit reversal
        const X = this.applyBitReversal(signal);

        // Butterfly computation
        for (let stage = 1; stage <= Math.log2(this.N); stage++) {
            const pairs = this.getButterflyPairs(stage, this.N);

            for (const { pair: [evenIndex, oddIndex], k, distance } of pairs) {
                const even = X[evenIndex];
                const odd = X[oddIndex];
                console.log(evenIndex, oddIndex, k, distance);

                const twiddle = this.getTwiddleFactor(k, distance, this.N);
                const product = Complex.multiply(odd, twiddle);
                X[evenIndex] = Complex.add(even, product);
                X[oddIndex] = Complex.subtract(even, product);
            }
        }

        return X;
    }

    extractCoefficients(complexValues) {
        const coefficients = {
            a: new Array(this.N / 2 + 1).fill(0),
            b: new Array(this.N / 2).fill(0)
        };

        // Start case: a0
        coefficients.a[0] = (1 / this.N) * complexValues[0].re;

        // General cases: ak and bk
        for (let k = 1; k < this.N / 2; k++) {
            coefficients.a[k] = (2 / this.N) * complexValues[k].re;
            coefficients.b[k] = (2 / this.N) * complexValues[k].im;
        }

        // End case: aN/2
        coefficients.a[this.N / 2] = (2 / this.N) * complexValues[this.N / 2].re;

        return coefficients;
    }

    evaluateSeries(coefficients, x) {
        // Implementation of:
        // S_m(x) = ((a_0 + a_m*cos(mx))/2) + Sum(k=1 to m-1)(a_k*cos(kx) + b_k*sin(kx))
        // where m = N/2 (maximum degree)

        // First term: (a_0 + a_m*cos(mx))/2
        const m = this.N / 2;
        let firstTerm = (coefficients.a[0] + coefficients.a[m] * Math.cos(m * x)) / 2;

        // Summation: Sum(k=1 to m-1)(a_k*cos(kx) + b_k*sin(kx))
        let sum = 0;
        for (let k = 1; k < m; k++) {
            sum += coefficients.a[k] * Math.cos(k * x) + coefficients.b[k] * Math.sin(k * x);
        }

        return firstTerm + sum;
    }

    // Helper method to compute FFT of a function
    computeFunction(funcStr) {
        const points = this.generatePoints(funcStr);
        const spectrum = this.butterflyCompute(points.y);
        const coefficients = this.extractCoefficients(spectrum);

        return {
            spectrum,
            coefficients,
            points
        };
    }

    generateInterpolatedPoints(coefficients) {
        const x = new Array(this.N);
        const y = new Array(this.N);

        for (let j = 0; j < this.N; j++) {
            x[j] = -Math.PI + (2 * Math.PI * j) / (this.N);
            // Store as Complex number for consistency with generatePoints()
            y[j] = new Complex(this.evaluateSeries(coefficients, x[j]));
        }

        return { x, y };
    }
}
