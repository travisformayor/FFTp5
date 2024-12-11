let fft;
let functionInput = "sin(x)";  // Default function
let N = 32;  // Increased from 8 for better visualization

function setup() {
  createCanvas(800, 800);
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
    // Compute FFT and get coefficients
    const result = fft.computeFunction(functionInput);

    // Draw original function
    drawFunction(result.points, 0, 'Original');

    // Draw reconstructed function
    drawReconstructed(result.coefficients, height / 3, 'Reconstructed');

    // Draw magnitude spectrum
    drawSpectrum(result.spectrum, 2 * height / 3, result.coefficients);

  } catch (e) {
    // Display errors
    textSize(16);
    fill(255, 0, 0);
    text(e.message, 10, 30);
  }
}

function drawFunction(points, yOffset, label) {
  // Draw axes
  stroke(0);
  line(0, yOffset + height / 6, width, yOffset + height / 6);  // x-axis
  line(width / 2, yOffset, width / 2, yOffset + height / 3);   // y-axis

  // Draw function
  stroke(0, 0, 255);
  noFill();
  beginShape();
  for (let i = 0; i < points.x.length; i++) {
    // Map x from [-π, π] to [0, width]
    let x = map(points.x[i], -Math.PI, Math.PI, 0, width);
    // Map y using real part of Complex number
    let y = map(points.y[i].re, -3, 3, yOffset + height / 3, yOffset);
    vertex(x, y);
  }
  endShape();

  // Draw label
  noStroke();
  fill(0);
  textSize(16);
  textAlign(LEFT);
  text(label, 10, yOffset + 20);
}

function drawSpectrum(spectrum, yOffset, coefficients) {
  // Draw axes
  stroke(0);
  line(0, yOffset + height / 6, width, yOffset + height / 6);  // x-axis (moved up)
  line(0, yOffset, 0, yOffset + height / 3);                   // y-axis

  // Draw magnitude spectrum
  stroke(255, 0, 0);
  const barWidth = width / spectrum.length;

  // Draw spectrum bars and coefficients
  for (let i = 0; i < spectrum.length; i++) {
    const magnitude = Complex.magnitude(spectrum[i]);
    const barHeight = map(magnitude, 0, N / 2, 0, height / 6);

    fill(255, 0, 0, 150);
    rect(i * barWidth, yOffset + height / 6,
      barWidth - 2, -barHeight);

    // Add frequency labels
    fill(0);
    noStroke();
    textAlign(CENTER);
    textSize(12);
    text(i, i * barWidth + barWidth / 2, yOffset + height / 6 + 15);

    // Show coefficient values under frequency bars
    textAlign(LEFT);
    if (i <= N / 2) {
      // show a coefficients for all i values
      text(`a${i}=${coefficients.a[i].toFixed(3)}`,
        i * barWidth * 2.5 + 10, yOffset + 20);
      if (i !== 0 && i !== N / 2) {
        // show b coefficients for all i except 0 and N/2
        text(`b${i}=${coefficients.b[i].toFixed(3)}`,
          i * barWidth * 2.5 + 10, yOffset + 40);
      }
    }
  }
}

function drawReconstructed(coefficients, yOffset, label) {
  // Draw axes
  stroke(0);
  line(0, yOffset + height / 6, width, yOffset + height / 6);  // x-axis
  line(width / 2, yOffset, width / 2, yOffset + height / 3);   // y-axis

  // Draw label
  noStroke();
  fill(0);
  textSize(16);
  textAlign(LEFT);
  text(label, 10, yOffset + 20);

  // Draw reconstructed function
  stroke(0, 255, 0);
  noFill();
  beginShape();
  for (let i = 0; i < width; i++) {
    const x = map(i, 0, width, -Math.PI, Math.PI);
    const y = fft.evaluateSeries(coefficients, x);
    vertex(i, map(y, -3, 3, yOffset + height / 3, yOffset));
  }
  endShape();
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

  // Test coefficient extraction
  totalTests++;
  const testSignal = [
    new Complex(1),    // C₀
    new Complex(0, 1), // C₁
    new Complex(-1),   // C₂
    new Complex(0)     // C₃
  ];
  const testFFT = new FFT(4);
  const coeffs = testFFT.extractCoefficients(testSignal);

  // Test a₀
  if (Math.abs(coeffs.a[0] - 0.5) < 1e-10) {
    console.log("✅ Passed: a₀ coefficient correct");
    testsPassed++;
  } else {
    console.log("❌ Failed: a₀ coefficient incorrect");
  }

  totalTests++;
  // Test a₁ and b₁
  if (Math.abs(coeffs.a[1]) < 1e-10 && Math.abs(coeffs.b[1] - (-0.5)) < 1e-10) {
    console.log("✅ Passed: a₁ and b₁ coefficients correct");
    testsPassed++;
  } else {
    console.log("❌ Failed: a₁ and b₁ coefficients incorrect");
  }

  totalTests++;
  // Test a₂ (final coefficient)
  if (Math.abs(coeffs.a[2] + 0.5) < 1e-10) {
    console.log("✅ Passed: a₂ coefficient correct");
    testsPassed++;
  } else {
    console.log("❌ Failed: a₂ coefficient incorrect");
  }

  // Test series reconstruction
  totalTests++;
  const x = Math.PI / 4;
  const reconstructed = testFFT.evaluateSeries(coeffs, x);
  const expected = 0.25 + 0.5 * Math.sin(x) - 0.5 * Math.cos(2 * x);
  if (Math.abs(reconstructed - expected) < 1e-10) {
    console.log("✅ Passed: Series reconstruction correct");
    testsPassed++;
  } else {
    console.log("❌ Failed: Series reconstruction incorrect");
  }

  // Summary
  console.log(`\nTest Summary: ${testsPassed}/${totalTests} tests passed`);
}