let fft;

function setup() {
  createCanvas(800, 400);
  fft = new FFT(8);
  const points = fft.generatePoints("pi*(pi-x)");
  console.log("Generated points:", points);

  fft.testFFT();
}

function draw() {
  background(220);
  // visualization here
}