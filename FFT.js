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

    // Test harness for FFT class
    testFFT() {
        // Test N validation
        console.assert(() => {
            try {
                new FFT(3); // Should throw
                return false;
            } catch (e) {
                return true;
            }
        }, "Non-power of 2 validation failed");

        // Test point generation
        const fft = new FFT(8);
        const points = fft.generatePoints("pi*(pi-x)");

        // Test x points are evenly spaced
        console.assert(
            Math.abs(points.x[1] - points.x[0] - (2 * Math.PI / 8)) < 1e-10,
            "X points not evenly spaced"
        );

        // Test function evaluation
        console.assert(
            Math.abs(points.y[0] - Math.PI * (Math.PI - points.x[0])) < 1e-10,
            "Function evaluation incorrect"
        );
    }
}