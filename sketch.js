let fft;

function setup() {
  createCanvas(800, 400);
  // fft = new FFT(8);
  // const points = fft.generatePoints("pi*(pi-x)");
  // console.log("Generated points:", points);

  testFFT();
}

function draw() {
  background(220);
  // visualization here
}

// Unit Tests
function testFFT() {
  // Test power of 2 validation
  try {
    new FFT(3);
    console.error("Failed: Should reject N=3");
  } catch(e) {
    console.log("Passed: N=3 validation");
  }

  const fft = new FFT(8);
  console.log(fft.bitReverseLookup);

  // Test twiddle factors
  console.assert(
    Math.abs(fft.W[0].re - 1.0) < 1e-10 && 
    Math.abs(fft.W[0].im - 0.0) < 1e-10,
    "W[0] incorrect"
  );
  
  console.assert(
    Math.abs(fft.W[1].re - 0.7071) < 1e-4 && 
    Math.abs(fft.W[1].im + 0.7071) < 1e-4,
    "W[1] incorrect"
  );

  // Test bit reversal
  const expectedReversals = [0, 4, 2, 6, 1, 5, 3, 7];
  const allReversalsCorrect = expectedReversals.every(
    (val, idx) => fft.bitReverseLookup[idx] === val
  );
  console.assert(allReversalsCorrect, "Bit reversal incorrect");

  // Test point generation
  const points = fft.generatePoints("pi*(pi-x)");
  console.assert(points.x.length === 8, "Wrong number of points");
  console.assert(
    Math.abs(points.x[1] - points.x[0] - (2 * Math.PI / 8)) < 1e-10,
    "Points not evenly spaced"
  );
}