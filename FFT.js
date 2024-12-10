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


}