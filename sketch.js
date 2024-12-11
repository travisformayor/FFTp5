let fft;
let functionInput = "sin(x)";  // Default function
let N = 16;  // Increase for smoother line (more points)

const width = 800;
const height = 700;

// Layout section positions. x and y are top left corner
const buffer = 10;
const input = { h: 25, w: 200 };
const spectrum = { h: 40 };
const body = { w: (width - (buffer * 2) - (width / 4)) };
const graph = {
  h: (height - input.h - (buffer * 4) - spectrum.h) / 2,
  w: body.w,
};
const coeffsBox = {
  h: (graph.h * 2) + buffer + spectrum.h,
  w: width - body.w - (buffer * 3)
};
const layout = {
  input: { x: buffer, y: buffer, w: input.w, h: input.h },
  original: { x: buffer, y: (buffer * 2) + input.h, w: graph.w, h: graph.h },
  interpolated: { x: buffer, y: (buffer * 2) + input.h + graph.h, w: graph.w, h: graph.h },
  spectrum: { x: buffer, y: (buffer * 3) + input.h + (graph.h * 2), w: graph.w, h: spectrum.h },
  coefficients: { x: (buffer * 2) + graph.w, y: input.h + (buffer * 2), w: coeffsBox.w, h: coeffsBox.h },
};

function setup() {
  createCanvas(width, height);
  testFFT();
  fft = new FFT(N);

  // Function input field
  let input = createInput(functionInput);
  input.position(10, height + 10);
  input.input(() => {
    functionInput = input.value();
  });
}

function draw() {
  background(225);

  // Draw each section's outline
  noFill();
  for (const section in layout) {
    rect(layout[section].x, layout[section].y, layout[section].w, layout[section].h);
  }

  try {
    // Compute FFT and get coefficients
    const result = fft.computeFunction(functionInput);

    // Draw each section using layout positions
    drawFunction(result.points, 'Original');
    drawInterpolated(result.coefficients, 'Interpolated');
    drawSpectrum(result.spectrum, result.coefficients);
    drawCoefficients(result.coefficients, 'Coefficients');

  } catch (e) {
    // Display errors in body section
    textSize(16);
    fill(255, 0, 0);
    text(e.message, layout.body.x, layout.body.y + 20);
  }
}

function drawFunction(points, label) {
  const section = layout.original;
  
  // Draw axes
  stroke(0);
  line(section.x, section.y + section.h/2, section.x + section.w, section.y + section.h/2);  // x-axis
  line(section.x + section.w/2, section.y, section.x + section.w/2, section.y + section.h);   // y-axis

  // Draw function
  stroke(0, 0, 255);
  noFill();
  beginShape();
  for (let i = 0; i < points.x.length; i++) {
    // Map x from [-π, π] to [0, width]
    let x = map(points.x[i], -Math.PI, Math.PI, section.x, section.x + section.w);
    // Map y using real part of complex number
    let y = map(points.y[i].re, -3, 3, section.y + section.h, section.y);
    vertex(x, y);
  }
  endShape();

  // Draw label
  noStroke();
  fill(0);
  textSize(16);
  textAlign(LEFT);
  text(label, section.x + 10, section.y + 20);
}

function drawSpectrum(spectrum, coefficients) {
  const section = layout.spectrum;
  
  // Draw axes
  stroke(0);
  line(section.x, section.y + section.h/2, section.x + section.w, section.y + section.h/2);  // x-axis (moved up)
  line(section.x + section.w/2, section.y, section.x + section.w/2, section.y + section.h);   // y-axis

  // Draw magnitude spectrum
  stroke(255, 0, 0);
  const barWidth = section.w / spectrum.length;

  // Draw spectrum bars and coefficients
  for (let i = 0; i < spectrum.length; i++) {
    const magnitude = Complex.magnitude(spectrum[i]);
    const barHeight = map(magnitude, 0, N / 2, 0, section.h);

    fill(255, 0, 0, 150);
    rect(i * barWidth, section.y + section.h/2,
      barWidth - 2, -barHeight);

    // Add frequency labels
    fill(0);
    noStroke();
    textAlign(CENTER);
    textSize(12);
    text(i, i * barWidth + barWidth / 2, section.y + section.h/2 + 15);

    // Show coefficient values under frequency bars
    textAlign(LEFT);
    if (i <= N / 2) {
      // show a coefficients for all i values
      text(`a${i}=${coefficients.a[i].toFixed(3)}`,
        i * barWidth * 2.5 + 10, section.y + 20);
      if (i !== 0 && i !== N / 2) {
        // show b coefficients for all i except 0 and N/2
        text(`b${i}=${coefficients.b[i].toFixed(3)}`,
          i * barWidth * 2.5 + 10, section.y + 40);
      }
    }
  }
}

function drawInterpolated(coefficients, label) {
  const section = layout.interpolated;
  
  // Draw axes
  stroke(0);
  line(section.x, section.y + section.h/2, section.x + section.w, section.y + section.h/2);  // x-axis
  line(section.x + section.w/2, section.y, section.x + section.w/2, section.y + section.h);   // y-axis

  // Draw label
  noStroke();
  fill(0);
  textSize(16);
  textAlign(LEFT);
  text(label, section.x + 10, section.y + 20);

  // Draw interpolated function
  stroke(0, 255, 0);
  noFill();
  beginShape();
  for (let i = 0; i < section.w; i++) {
    const x = map(i, 0, section.w, -Math.PI, Math.PI);
    const y = fft.evaluateSeries(coefficients, x);
    vertex(i, map(y, -3, 3, section.y + section.h, section.y));
  }
  endShape();
}

function drawCoefficients(coefficients, label) {
  const section = layout.coefficients;
  const padding = 20;
  const lineHeight = 20;
  
  // Draw label
  noStroke();
  fill(0);
  textSize(16);
  textAlign(LEFT);
  text(label, section.x + 10, section.y + 20);

  // Column headers
  textSize(14);
  const colWidth = (section.w - (padding * 3)) / 2;
  text("a coefficients", section.x + padding, section.y + 40);
  text("b coefficients", section.x + padding * 2 + colWidth, section.y + 40);

  // Draw coefficients
  textSize(12);
  for (let i = 0; i <= N/2; i++) {
    // a coefficients
    text(`a${i} = ${coefficients.a[i].toFixed(4)}`,
      section.x + padding,
      section.y + 60 + (i * lineHeight));
    
    // b coefficients (skip b₀ and b_{N/2})
    if (i !== 0 && i !== N/2) {
      text(`b${i} = ${coefficients.b[i].toFixed(4)}`,
        section.x + padding * 2 + colWidth,
        section.y + 60 + (i * lineHeight));
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

  // Test series interpolation approximation
  totalTests++;
  const x = Math.PI / 4;
  const interpolated = testFFT.evaluateSeries(coeffs, x);
  const expected = 0.25 + 0.5 * Math.sin(x) - 0.5 * Math.cos(2 * x);
  if (Math.abs(interpolated - expected) < 1e-10) {
    console.log("✅ Passed: Series interpolated correctly");
    testsPassed++;
  } else {
    console.log("❌ Failed: Series interpolated incorrectly");
  }

  // Summary
  console.log(`\nTest Summary: ${testsPassed}/${totalTests} tests passed`);
}