// ------ Audio Setup ------
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();
const sampleRate = 8000;
const bufferSize = 512;

let t = 0;
let playing = false;
let reverse = false;
let speed = 1;
let volume = 1;

// Get DOM elements
const playPauseBtn = document.getElementById('playPauseBtn');
const stopBtn = document.getElementById('stopBtn');
const reverseBtn = document.getElementById('reverseBtn');
const speedRange = document.getElementById('speedRange');
const speedValue = document.getElementById('speedValue');
const volumeRange = document.createElement('input');
const volumeLabel = document.createElement('label');
const speedContainer = speedRange.parentNode;
const codeInput = document.getElementById('codeInput');
const playSaliSongBtn = document.getElementById('playSaliSong');

const canvas = document.getElementById('waveform');
const ctx = canvas.getContext('2d');

let userFunction = null;
let saliSongPlaying = false;

// Setup Gain Node for volume control
const gainNode = audioCtx.createGain();
gainNode.gain.value = volume; // initial volume
const scriptNode = audioCtx.createScriptProcessor(bufferSize, 0, 1);
scriptNode.connect(gainNode);
gainNode.connect(audioCtx.destination);

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

scriptNode.onaudioprocess = (event) => {
  if (!playing) return;

  const output = event.outputBuffer.getChannelData(0);
  const waveformPoints = [];

  for (let i = 0; i < output.length; i++) {
    // Calculate time index adjusted for speed and reverse
    let adjustedT;
    if (reverse) {
      t -= speed;
      if (t < 0) t = 0;
      adjustedT = Math.floor(t);
    } else {
      adjustedT = Math.floor(t);
      t += speed;
    }

    let sample;
    if (saliSongPlaying) {
      sample = saliGetSample(adjustedT);
    } else if (userFunction) {
      sample = userFunction(adjustedT);
    } else {
      sample = 128; // silence
    }

    // Normalize from 0-255 to -1..1 float
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

// Add volume slider to controls
volumeLabel.textContent = 'Volume:';
volumeLabel.style.color = 'white';
volumeLabel.style.marginLeft = '15px';
volumeRange.type = 'range';
volumeRange.min = 0;
volumeRange.max = 1;
volumeRange.step = 0.01;
volumeRange.value = volume;
volumeRange.style.verticalAlign = 'middle';
speedContainer.appendChild(volumeLabel);
speedContainer.appendChild(volumeRange);

// Event Handlers
volumeRange.addEventListener('input', (e) => {
  volume = Number(e.target.value);
  gainNode.gain.setTargetAtTime(volume, audioCtx.currentTime, 0.01);
});

playPauseBtn.addEventListener('click', async () => {
  if (audioCtx.state === 'suspended') await audioCtx.resume();

  if (playing) {
    playing = false;
    playPauseBtn.textContent = 'Play';
  } else {
    // Compile user code from textarea unless playing salinewin
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
  speedValue.textContent = speed.toFixed(2) + 'x';
});

playSaliSongBtn.addEventListener('click', async () => {
  if (audioCtx.state === 'suspended') await audioCtx.resume();

  saliSongPlaying = true;
  playing = true;
  t = 0;
  playPauseBtn.textContent = 'Pause';
});

// Initialize display texts
speedValue.textContent = speedRange.value + 'x';
volumeLabel.style.marginLeft = '15px';
