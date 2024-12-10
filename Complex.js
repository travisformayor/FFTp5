class Complex {
    // Complex number class
    // Used for proper handling of complex numbers
    constructor(re, im = 0) {
        this.re = re;
        this.im = im;
    }

    static add(a, b) {
        return new Complex(a.re + b.re, a.im + b.im);
    }

    static subtract(a, b) {
        return new Complex(a.re - b.re, a.im - b.im);
    }

    static multiply(a, b) {
        return new Complex(
            a.re * b.re - a.im * b.im,
            a.re * b.im + a.im * b.re
        );
    }

    static magnitude(a) {
        return Math.sqrt(a.re * a.re + a.im * a.im);
    }

    static phase(a) {
        return Math.atan2(a.im, a.re);
    }
}
