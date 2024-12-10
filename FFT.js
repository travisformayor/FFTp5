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