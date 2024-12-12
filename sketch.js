let fft;
let functionString = "cos(x)";  // Default function
let N = 32;  // Increase for smoother line (more points)

const width = 800;
const height = 600;

// Layout section positions. x and y are top left corner
const buffer = 10;
const functionLabelWidth = 80;
const inputBox = { x: functionLabelWidth, h: 25, w: 200 };
const dropdownLabelWidth = 25;
const dropdownBox = { x: dropdownLabelWidth, h: 25, w: 60 };
const spectrum = { h: 60 };
const body = { w: (width - (buffer * 2) - (width / 4)) };
const graph = {
  h: (height - inputBox.h - (buffer * 5) - spectrum.h) / 2,
  w: body.w,
};
const coeffsBox = {
  h: (graph.h * 2) + (buffer * 2) + spectrum.h,
  w: width - body.w - (buffer * 3)
};
const layout = {
  functionDropdown: { x: buffer + inputBox.x, y: buffer, w: inputBox.w, h: inputBox.h },
  inputBox: { x: buffer + inputBox.x + inputBox.w + buffer, y: buffer, w: inputBox.w, h: inputBox.h },
  dropdownBox: { x: (buffer * 3) + inputBox.x + (inputBox.w * 2) + dropdownBox.x, y: buffer, w: dropdownBox.w, h: dropdownBox.h },
  original: { x: buffer, y: (buffer * 2) + inputBox.h, w: graph.w, h: graph.h },
  interpolated: { x: buffer, y: (buffer * 3) + inputBox.h + graph.h, w: graph.w, h: graph.h },
  spectrum: { x: buffer, y: (buffer * 4) + inputBox.h + (graph.h * 2), w: graph.w, h: spectrum.h },
  coefficients: { x: (buffer * 2) + graph.w, y: inputBox.h + (buffer * 2), w: coeffsBox.w, h: coeffsBox.h },
};

function setup() {
  createCanvas(width, height);
  testFFT();
  fft = new FFT(N);

  // Function selection dropdown
  let functionLabel = createElement('label', 'Function:');
  functionLabel.position(layout.functionDropdown.x - functionLabelWidth, layout.functionDropdown.y);
  functionLabel.style('font-size', '20px');

  let functionSelect = createSelect();
  functionSelect.position(layout.functionDropdown.x, layout.functionDropdown.y);
  functionSelect.style('font-size', '18px');
  functionSelect.size(layout.functionDropdown.w, layout.functionDropdown.h);

  // Add function options
  const functions = [
    'cos(x)',
    'cos(3x)',
    'sin(x)',
    'sin(2x)',
    'sin(x^2)',
    'e^x',
    '|x|',
    'x',
    'pi(x-pi)',
    'cos(pi*x)-2*sin(pi*x)',
    'custom'
  ];
  functions.forEach(f => functionSelect.option(f));
  functionSelect.selected(functionString);

  // Custom function input field
  let functionInput = createInput('');  // Start empty
  functionInput.position(layout.inputBox.x, layout.inputBox.y);
  functionInput.size(layout.inputBox.w - 8, layout.inputBox.h - 6);
  functionInput.style('font-size', '18px');
  functionInput.attribute('disabled', '');  // Initially disabled

  // Handle dropdown changes
  functionSelect.changed(() => {
    const selected = functionSelect.value();
    if (selected === 'custom') {
      functionInput.removeAttribute('disabled');
      functionInput.value(functionString);  // Show current function string when enabled
      functionString = functionInput.value();
    } else {
      functionInput.attribute('disabled', '');
      functionInput.value('');  // Clear the input when disabled
      functionString = selected;
    }
  });

  // Handle custom input changes
  functionInput.input(() => {
    if (functionSelect.value() === 'custom') {
      functionString = functionInput.value();
    }
  });

  // N selection dropdown
  let nLabel = createElement('label', 'N:');
  nLabel.position(layout.dropdownBox.x - dropdownLabelWidth, layout.dropdownBox.y);
  nLabel.style('font-size', '20px');

  let nSelect = createSelect();
  nSelect.position(layout.dropdownBox.x, layout.dropdownBox.y);
  nSelect.style('font-size', '18px');
  nSelect.size(layout.dropdownBox.w, layout.dropdownBox.h);
  nSelect.option('4');
  nSelect.option('8');
  nSelect.option('16');
  nSelect.option('32');
  nSelect.option('64');
  nSelect.selected(N.toString());
  nSelect.changed(() => {
    N = parseInt(nSelect.value());
    fft = new FFT(N);  // Recreate FFT with new N
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
    // Generate points for displaying original and use in interpolation
    const highResPoints = fft.generatePoints(functionString, 256);
    const fftPoints = fft.generatePoints(functionString);

    // Compute FFT and get coefficients
    const result = fft.computeFunction(fftPoints);

    // Draw original function
    drawFunction(highResPoints, layout.original, 'Original', [0, 0, 255]);

    // Draw interpolated function
    const interpolatedPoints = fft.generateInterpolatedPoints(result.coefficients);
    drawFunction(interpolatedPoints, layout.interpolated, 'Interpolated', [0, 255, 0]);

    // Draw spectrum and coefficients
    drawSpectrum(result.spectrum);
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
  // Start a new drawing state
  push();
  // Create clipping region for this section
  clip(() => {
    rect(section.x, section.y, section.w, section.h);
  });

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

  // End drawing state (removes the clip)
  pop();

  // Draw labels outside of clipping region
  noStroke();
  fill(0);
  textSize(16);
  textAlign(CENTER);
  text("-π", section.x + 10, section.y + section.h / 2 + 20);
  text("π", section.x + section.w - 10, section.y + section.h / 2 + 20);

  textAlign(LEFT);
  text(label, section.x + 10, section.y + 20);
}

function drawSpectrum(spectrum) {
  const section = layout.spectrum;

  stroke(255, 0, 0);
  const barWidth = section.w / (spectrum.length / 2);

  // Find the maximum magnitude for scaling
  let maxMagnitude = 0;
  for (let i = 0; i < spectrum.length / 2; i++) {
    maxMagnitude = Math.max(maxMagnitude, Complex.magnitude(spectrum[i]));
  }

  for (let i = 0; i < spectrum.length / 2; i++) {
    const magnitude = Complex.magnitude(spectrum[i]);
    // Map magnitude to [0, section.h] using the actual maximum magnitude
    const barHeight = map(magnitude, 0, maxMagnitude, 0, section.h);

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

  // Start a new drawing state
  push();
  // Create clipping region for this section
  clip(() => {
    rect(section.x, section.y, section.w, section.h);
  });

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

  // End drawing state (removes the clip)
  pop();
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

  // Test bit reversal application
  totalTests++;
  let fft8 = new FFT(8);
  const testSignal = [1, 2, 3, 4, 5, 6, 7, 8].map(x => new Complex(x));
  const reversedSignal = fft8.applyBitReversal(testSignal);
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
  fft8 = new FFT(8); // reset fft8 for new test
  const points = fft8.generatePoints("pi(pi-x)");
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
  fft8 = new FFT(8); // reset fft8 for new test
  const stage1Pairs = fft8.getButterflyPairs(1, 8);
  const expectedStage1 = [
    { pair: [0, 1], k: 0, distance: 1 },
    { pair: [2, 3], k: 2, distance: 1 },
    { pair: [4, 5], k: 4, distance: 1 },
    { pair: [6, 7], k: 6, distance: 1 }
  ];
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
  const expectedStage2 = [
    { pair: [0, 2], k: 0, distance: 2 },
    { pair: [1, 3], k: 1, distance: 2 },
    { pair: [4, 6], k: 4, distance: 2 },
    { pair: [5, 7], k: 5, distance: 2 }
  ];
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
  const expectedStage3 = [
    { pair: [0, 4], k: 0, distance: 4 },
    { pair: [1, 5], k: 1, distance: 4 },
    { pair: [2, 6], k: 2, distance: 4 },
    { pair: [3, 7], k: 3, distance: 4 }
  ];

  if (JSON.stringify(stage3Pairs) === JSON.stringify(expectedStage3)) {
    console.log("✅ Passed: Stage 3 butterfly pairs correct");
    testsPassed++;
  } else {
    console.log("❌ Failed: Stage 3 butterfly pairs incorrect");
    console.log("Expected:", expectedStage3);
    console.log("Got:", stage3Pairs);
  }

  // Test twiddle factors
  fft8 = new FFT(8); // reset fft8 for new test
  function testTwiddleFactor(k, distance, N, expected, tolerance = 1e-3) {
    const twiddle = fft8.getTwiddleFactor(k, distance, N);
    const reOk = Math.abs(twiddle.re - expected.re) < tolerance;
    const imOk = Math.abs(twiddle.im - expected.im) < tolerance;
    return {
      passed: reOk && imOk,
      got: twiddle,
      expected: expected
    };
  }

  // Twiddle factors from 0 to N
  const twiddle_tests = [
    { k: 0, expected: { re: 1, im: 0 } },           // W^0
    { k: 1, expected: { re: 0.707, im: -0.707 } },  // W^1
    { k: 2, expected: { re: 0, im: -1 } },          // W^2
    { k: 3, expected: { re: -0.707, im: -0.707 } }, // W^3
    { k: 4, expected: { re: -1, im: 0 } },          // W^4
    { k: 5, expected: { re: -0.707, im: 0.707 } },  // W^5
    { k: 6, expected: { re: 0, im: 1 } },           // W^6
    { k: 7, expected: { re: 0.707, im: 0.707 } },   // W^7
    { k: 8, expected: { re: 1, im: 0 } }            // W^8 (same as W^0)
  ];

  twiddle_tests.forEach(test => {
    totalTests++;
    const result = testTwiddleFactor(test.k, 4, 8, test.expected);
    if (result.passed) {
      console.log(`✅ Passed: Twiddle factor W^${test.k} correct`);
      testsPassed++;
    } else {
      console.log(`❌ Failed: Twiddle factor W^${test.k} incorrect`);
      console.log("Expected:", test.expected);
      console.log("Got:", JSON.stringify(result.got));
    }
  });

  // Summary
  console.log(`\nTest Summary: ${testsPassed}/${totalTests} tests passed`);
}