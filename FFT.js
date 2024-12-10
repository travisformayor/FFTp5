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
            W[k] = {
                re: Math.cos(angle),
                im: -Math.sin(angle)
            };
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
        // Replace 'pi' with Math.PI and 'x' with the value
        const evalStr = funcStr
            .replace(/pi/g, 'Math.PI')
            .replace(/x/g, `(${x})`);
        return eval(evalStr);
    }

    generatePoints(funcStr) {
        const x = new Array(this.N);
        const y = new Array(this.N);

        for (let j = 0; j < this.N; j++) {
            x[j] = -Math.PI + (2 * Math.PI * j) / this.N;
            y[j] = this.evaluateFunction(funcStr, x[j]);
        }

        return { x, y };
    }


}