let fft;
let functionInput = "sin(x)";  // Default function
let N = 32;  // Increased from 8 for better visualization

function setup() {
  createCanvas(800, 400);
  testFFT();
  fft = new FFT(N);

  // Create input field for function
  let input = createInput(functionInput);
  input.position(10, height + 10);
  input.input(() => {
    functionInput = input.value();
  });
}

function draw() {
  background(220);

  try {
    // Compute FFT
    const points = fft.generatePoints(functionInput);
    const spectrum = fft.computeFunction(functionInput);

    // Draw original function
    drawFunction(points, 0);

    // Draw magnitude spectrum
    drawSpectrum(spectrum, height / 2);

  } catch (e) {
    // Handle invalid function input
    textSize(16);
    fill(255, 0, 0);
    text("Invalid function: " + e.message, 10, 30);
  }
}

function drawFunction(points, yOffset) {
  // Draw axes
  stroke(0);
  line(0, yOffset + height / 4, width, yOffset + height / 4);  // x-axis
  line(width / 2, yOffset, width / 2, yOffset + height / 2);     // y-axis

  // Draw function
  stroke(0, 0, 255);
  noFill();
  beginShape();
  for (let i = 0; i < points.x.length; i++) {
    // Map x from [-π, π] to [0, width]
    let x = map(points.x[i], -Math.PI, Math.PI, 0, width);
    // Map y to quarter of height, using real part of Complex number
    let y = map(points.y[i].re, -3, 3, yOffset + height / 2, yOffset);
    vertex(x, y);
  }
  endShape();
}

function drawSpectrum(spectrum, yOffset) {
  // Draw axes
  stroke(0);
  line(0, yOffset + height / 4, width, yOffset + height / 4);  // x-axis
  line(0, yOffset, 0, yOffset + height / 2);                 // y-axis

  // Draw magnitude spectrum
  stroke(255, 0, 0);
  const barWidth = width / spectrum.length;

  for (let i = 0; i < spectrum.length; i++) {
    const magnitude = Complex.magnitude(spectrum[i]);
    const barHeight = map(magnitude, 0, N / 2, 0, height / 4);

    fill(255, 0, 0, 150);
    rect(i * barWidth, yOffset + height / 4,
      barWidth - 2, -barHeight);

    // Add frequency labels
    if (i % 4 === 0) {  // Label every 4th frequency
      fill(0);
      noStroke();
      text(i, i * barWidth, yOffset + height / 4 + 15);
    }
  }
}

// Unit Tests
function testFFT() {
  let testsPassed = 0;
  let totalTests = 0;

  // Test power of 2 validation
  totalTests++;
  try {
    new FFT(3);
    console.log("❌ Failed: Should reject N=3");
  } catch (e) {
    console.log("✅ Passed: N=3 validation");
    testsPassed++;
  }

  const fft = new FFT(8);

  // Test twiddle factors
  totalTests++;
  if (Math.abs(fft.W[0].re - 1.0) < 1e-10 && Math.abs(fft.W[0].im - 0.0) < 1e-10) {
    console.log("✅ Passed: W[0] is correct");
    testsPassed++;
  } else {
    console.log("❌ Failed: W[0] incorrect");
  }

  totalTests++;
  if (Math.abs(fft.W[1].re - 0.7071) < 1e-4 && Math.abs(fft.W[1].im + 0.7071) < 1e-4) {
    console.log("✅ Passed: W[1] is correct");
    testsPassed++;
  } else {
    console.log("❌ Failed: W[1] incorrect");
  }

  // Test bit reversal
  totalTests++;
  const expectedReversals = [0, 4, 2, 6, 1, 5, 3, 7];
  const allReversalsCorrect = expectedReversals.every(
    (val, idx) => fft.bitReverseLookup[idx] === val
  );
  if (allReversalsCorrect) {
    console.log("✅ Passed: Bit reversal is correct");
    testsPassed++;
  } else {
    console.log("❌ Failed: Bit reversal incorrect");
  }

  // Test point generation
  totalTests++;
  const points = fft.generatePoints("pi(pi-x)");
  if (points.x.length === 8) {
    console.log("✅ Passed: Point count is correct");
    testsPassed++;
  } else {
    console.log("❌ Failed: Wrong number of points");
  }

  totalTests++;
  if (Math.abs(points.x[1] - points.x[0] - (2 * Math.PI / 8)) < 1e-10) {
    console.log("✅ Passed: Points are evenly spaced");
    testsPassed++;
  } else {
    console.log("❌ Failed: Points not evenly spaced");
  }

  // Summary
  console.log(`\nTest Summary: ${testsPassed}/${totalTests} tests passed`);
}