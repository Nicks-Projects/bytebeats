// ------ Audio Setup ------
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();
const sampleRate = 8000;
const bufferSize = 512;

let t = 0;
let playing = false;
let reverse = false;
let speed = 1;

// Get DOM elements
const playPauseBtn = document.getElementById('playPauseBtn');
const stopBtn = document.getElementById('stopBtn');
const reverseBtn = document.getElementById('reverseBtn');
const speedRange = document.getElementById('speedRange');
const speedValue = document.getElementById('speedValue');
const codeInput = document.getElementById('codeInput');
const playSaliSongBtn = document.getElementById('playSaliSong');

const canvas = document.getElementById('waveform');
const ctx = canvas.getContext('2d');

let userFunction = null;
let saliSongPlaying = false;

// Salinewin.exe full virus bytebeat song code functions
function saliPart1(t) {
  return (t * ((t & 4096 ? (t % 65536 < 59392 ? 7 : t & 7) : 16) + (1 & (t >> 14))))
    >> (3 & (-t >> (t & 2048 ? 2 : 10))) | t >> (t & 16384 ? (t & 4096 ? 10 : 3) : 2);
}

function saliPart2(t) {
  return (t * ((t & 4096 ? (t % 65536 < 59392 ? 7 : t & 4) : 16) ^ (1 & (t >> 14))))
    >> (3 & (-t >> (t & 2048 ? 2 : 10)));
}

function saliPart3(t) {
  return (t * (t >> 5 | t >> 8)) >> (t >> 16);
}

function saliGetSample(t) {
  if (t < 160000) return saliPart1(t);
  if (t < 320000) return saliPart2(t);
  if (t < 480000) return saliPart3(t);
  return saliPart1(0);
}

// Parse and compile user's code into a function of t
function compileUserCode(code) {
  try {
    /* eslint-disable no-new-func */
    return new Function('t', 'with (Math) { return ' + code + '; }');
  } catch (e) {
    console.error('Error compiling bytebeat code:', e);
    return null;
  }
}

// Audio processing
const scriptNode = audioCtx.createScriptProcessor(bufferSize, 0, 1);
scriptNode.connect(audioCtx.destination);

scriptNode.onaudioprocess = (event) => {
  if (!playing) return;

  const output = event.outputBuffer.getChannelData(0);
  const waveformPoints = [];

  for (let i = 0; i < output.length; i++) {
    let timeIndex = reverse ? t-- : t++;
    // Clamp to 0 so we don't go negative
    if (timeIndex < 0) timeIndex = 0;

    let sample;
    if (saliSongPlaying) {
      sample = saliGetSample(Math.floor(timeIndex * speed));
    } else if (userFunction) {
      // Provide time adjusted for speed, rounded as integer
      sample = userFunction(Math.floor(timeIndex * speed));
    } else {
      sample = 128; // silence
    }

    // Normalize to -1..1 for waveform and output
    const normalizedSample = ((sample & 0xff) - 128) / 128;
    output[i] = normalizedSample;
    waveformPoints.push(normalizedSample);
  }

  drawWaveform(waveformPoints);
};

function drawWaveform(points) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#00ff00';
  ctx.moveTo(0, canvas.height / 2);
  for (let i = 0; i < points.length; i++) {
    const x = (i / points.length) * canvas.width;
    const y = (points[i] * 0.4 + 0.5) * canvas.height;
    ctx.lineTo(x, y);
  }
  ctx.stroke();
}

// Event Handlers
playPauseBtn.addEventListener('click', async () => {
  if (audioCtx.state === 'suspended') await audioCtx.resume();

  if (playing) {
    playing = false;
    playPauseBtn.textContent = 'Play';
  } else {
    // Compile user code
    if (!saliSongPlaying) {
      const code = codeInput.value.trim();
      const func = compileUserCode(code);
      if (!func) {
        alert('Invalid bytebeat code');
        return;
      }
      userFunction = func;
      t = 0;
    }
    playing = true;
    playPauseBtn.textContent = 'Pause';
  }
});

stopBtn.addEventListener('click', () => {
  playing = false;
  t = 0;
  playPauseBtn.textContent = 'Play';
});

reverseBtn.addEventListener('click', () => {
  reverse = !reverse;
  reverseBtn.textContent = 'Reverse: ' + (reverse ? 'On' : 'Off');
});

speedRange.addEventListener('input', (e) => {
  speed = Number(e.target.value);
  speedValue.textContent = speed.toFixed(1) + 'x';
});

playSaliSongBtn.addEventListener('click', async () => {
  if (audioCtx.state === 'suspended') await audioCtx.resume();

  saliSongPlaying = true;
  playing = true;
  t = 0;
  playPauseBtn.textContent = 'Pause';
});

// Initialize speed display
speedValue.textContent = speedRange.value + 'x';
