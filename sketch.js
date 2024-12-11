let fft;
let functionInput = "sin(x)";  // Default function
let N = 8;  // Increase for smoother line (more points)

const width = 800;
const height = 700;

// Layout section positions. x and y are top left corner
const buffer = 10;
const input = { h: 25, w: 200 };
const spectrum = { h: 60 };
const body = { w: (width - (buffer * 2) - (width / 4)) };
const graph = {
  h: (height - input.h - (buffer * 5) - spectrum.h) / 2,
  w: body.w,
};
const coeffsBox = {
  h: (graph.h * 2) + (buffer * 2) + spectrum.h,
  w: width - body.w - (buffer * 3)
};
const layout = {
  input: { x: buffer, y: buffer, w: input.w, h: input.h },
  original: { x: buffer, y: (buffer * 2) + input.h, w: graph.w, h: graph.h },
  interpolated: { x: buffer, y: (buffer * 3) + input.h + graph.h, w: graph.w, h: graph.h },
  spectrum: { x: buffer, y: (buffer * 4) + input.h + (graph.h * 2), w: graph.w, h: spectrum.h },
  coefficients: { x: (buffer * 2) + graph.w, y: input.h + (buffer * 2), w: coeffsBox.w, h: coeffsBox.h },
};

function setup() {
  createCanvas(width, height);
  testFFT();
  fft = new FFT(N);

  // Function input field
  let input = createInput(functionInput);
  input.position(layout.input.x, layout.input.y);
  input.size(layout.input.w - 8, layout.input.h - 6);
  input.input(() => {
    functionInput = input.value();
  });
}

function draw() {
  background(225);

  // Draw each section container
  noStroke();
  fill(255);
  for (const section in layout) {
    rect(layout[section].x, layout[section].y, layout[section].w, layout[section].h);
  }

  try {
    // Compute FFT and get coefficients
    const result = fft.computeFunction(functionInput);

    // Draw original function
    drawFunction(result.points, layout.original, 'Original', [0, 0, 255]);

    // Draw interpolated function
    const interpolatedPoints = fft.generateInterpolatedPoints(result.coefficients);
    drawFunction(interpolatedPoints, layout.interpolated, 'Interpolated', [0, 255, 0]);

    drawSpectrum(result.spectrum, result.coefficients);
    drawCoefficients(result.coefficients, 'Coefficients');

  } catch (e) {
    // Display errors in body section
    textSize(18);
    fill(255, 0, 0);
    noStroke();
    text(e.message, layout.original.x + 20, layout.original.y + 20);
  }

}

function drawFunction(points, section, label, color = [0, 0, 255]) {
  // Draw axes
  stroke(0);
  line(section.x, section.y + section.h / 2, section.x + section.w, section.y + section.h / 2);  // x-axis
  line(section.x + section.w / 2, section.y, section.x + section.w / 2, section.y + section.h);   // y-axis

  // Draw function
  stroke(...color);
  noFill();
  beginShape();
  for (let i = 0; i < points.x.length; i++) {
    // Map x from [-π, π] to [0, width]
    const x = map(points.x[i], -Math.PI, Math.PI, section.x, section.x + section.w);
    // Map y using real part of complex number
    const y = map(points.y[i].re, -3, 3, section.y + section.h, section.y);
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

  // Draw magnitude spectrum
  stroke(255, 0, 0);
  const barWidth = section.w / spectrum.length;

  // Draw spectrum bars and coefficients
  for (let i = 0; i < spectrum.length; i++) {
    const magnitude = Complex.magnitude(spectrum[i]);
    const barHeight = map(magnitude, 0, N, 0, section.h);

    fill(255, 0, 0, 150);
    rect(i * barWidth + section.x + 1.5, section.y,
      barWidth - 2, -barHeight);

    // Add frequency labels
    fill(0);
    noStroke();
    textAlign(CENTER);
    textSize(12);
    text(i, i * barWidth + barWidth / 2 + section.x, section.y + 15);
  }
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
  // Draw coefficients
  textSize(12);
  for (let i = 0; i <= N / 2; i++) {
    // a coefficients
    text(`a${i} = ${coefficients.a[i].toFixed(4)}`,
      section.x + padding,
      section.y + 40 + (i * lineHeight));

    // b coefficients (skip b₀ and b_{N/2})
    if (i !== 0 && i !== N / 2) {
      text(`b${i} = ${coefficients.b[i].toFixed(4)}`,
        section.x + padding * 2 + colWidth,
        section.y + 40 + (i * lineHeight));
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

  // Test bit reversal application
  totalTests++;
  const testSignal = [1, 2, 3, 4, 5, 6, 7, 8].map(x => new Complex(x));
  const reversedSignal = fft.applyBitReversal(testSignal);
  const expectedOrder = [1, 5, 3, 7, 2, 6, 4, 8];
  const correctOrder = expectedOrder.every((val, idx) => 
    Math.abs(reversedSignal[idx].re - val) < 1e-10
  );
  if (correctOrder) {
    console.log("✅ Passed: Bit reversal correctly applied");
    testsPassed++;
  } else {
    console.log("❌ Failed: Bit reversal incorrectly applied");
    console.log("Expected order:", expectedOrder);
    console.log("Got:", reversedSignal.map(x => x.re));
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

  // Test butterfly pair generation
  totalTests++;
  const fft8 = new FFT(8);
  const stage1Pairs = fft8.getButterflyPairs(1, 8);
  const expectedStage1 = [[0, 4], [1, 5], [2, 6], [3, 7]];
  if (JSON.stringify(stage1Pairs) === JSON.stringify(expectedStage1)) {
    console.log("✅ Passed: Stage 1 butterfly pairs correct");
    testsPassed++;
  } else {
    console.log("❌ Failed: Stage 1 butterfly pairs incorrect");
    console.log("Expected:", expectedStage1);
    console.log("Got:", stage1Pairs);
  }

  totalTests++;
  const stage2Pairs = fft8.getButterflyPairs(2, 8);
  const expectedStage2 = [[0, 2], [1, 3], [4, 6], [5, 7]];
  if (JSON.stringify(stage2Pairs) === JSON.stringify(expectedStage2)) {
    console.log("✅ Passed: Stage 2 butterfly pairs correct");
    testsPassed++;
  } else {
    console.log("❌ Failed: Stage 2 butterfly pairs incorrect");
    console.log("Expected:", expectedStage2);
    console.log("Got:", stage2Pairs);
  }

  totalTests++;
  const stage3Pairs = fft8.getButterflyPairs(3, 8);
  const expectedStage3 = [[0, 1], [2, 3], [4, 5], [6, 7]];
  if (JSON.stringify(stage3Pairs) === JSON.stringify(expectedStage3)) {
    console.log("✅ Passed: Stage 3 butterfly pairs correct");
    testsPassed++;
  } else {
    console.log("❌ Failed: Stage 3 butterfly pairs incorrect");
    console.log("Expected:", expectedStage3);
    console.log("Got:", stage3Pairs);
  }

  // Test twiddle factors
  const expectedTwiddles = [
    { re: 1, im: 0 },           // W^0
    { re: 0.707, im: -0.707 },  // W^1
    { re: 0, im: -1 },          // W^2
    { re: -0.707, im: -0.707 }, // W^3
    { re: -1, im: 0 },          // W^4
    { re: -0.707, im: 0.707 },  // W^5
    { re: 0, im: 1 },           // W^6
    { re: 0.707, im: 0.707 },   // W^7
    { re: 1, im: 0 }            // W^8
  ];

  function testTwiddleFactor(k, butterflySize, N, expected, tolerance = 1e-3) {
    const twiddle = fft8.getTwiddleFactor(k, butterflySize, N);
    const reOk = Math.abs(twiddle.re - expected.re) < tolerance;
    const imOk = Math.abs(twiddle.im - expected.im) < tolerance;
    return {
      passed: reOk && imOk,
      got: twiddle,
      expected: expected
    };
  }

  // Test basic twiddle factors
  totalTests++;
  const twiddle0 = testTwiddleFactor(0, 2, 8, expectedTwiddles[0]);
  if (twiddle0.passed) {
    console.log("✅ Passed: Twiddle factor W^0 correct");
    testsPassed++;
  } else {
    console.log("❌ Failed: Twiddle factor W^0 incorrect");
    console.log("Expected:", twiddle0.expected);
    console.log("Got:", twiddle0.got);
  }

  totalTests++;
  const twiddle2 = testTwiddleFactor(1, 4, 8, expectedTwiddles[2]);
  if (twiddle2.passed) {
    console.log("✅ Passed: Twiddle factor W^2 correct");
    testsPassed++;
  } else {
    console.log("❌ Failed: Twiddle factor W^2 incorrect");
    console.log("Expected:", twiddle2.expected);
    console.log("Got:", twiddle2.got);
  }

  // Test twiddle factor looping (should wrap back to start)
  totalTests++;
  // Testing W⁸ which should equal W⁰ due to periodicity
  const twiddleLoop = testTwiddleFactor(4, 4, 8, expectedTwiddles[0]);
  if (twiddleLoop.passed) {
    console.log("✅ Passed: Twiddle factor W^8 (looped) correct");
    testsPassed++;
  } else {
    console.log("❌ Failed: Twiddle factor W^8 (looped) incorrect");
    console.log("Expected:", twiddleLoop.expected);
    console.log("Got:", twiddleLoop.got);
  }

  // Summary
  console.log(`\nTest Summary: ${testsPassed}/${totalTests} tests passed`);
}