// === Configuración de cada diseño ===
const designConfigs = [
  {
    url:      'https://raw.githubusercontent.com/DLopezHub/pintacaras/5b7c033b743f61d8248459bc6b869a8b53730612/05.png',
    scale:    5.0,
    offsetX:  0,
    offsetY: -35,
    start:    263,
    end:      362,
    anchor:   386,
    rotationOffset: 0
  },
  {
    url:      'https://raw.githubusercontent.com/DLopezHub/pintacaras/18c4e4b5d26a102939e6e2ab6c9a28c8633fd049/01_.png',
    scale:    6.0,
    offsetX:   0,
    offsetY:  60,
    start:    263,
    end:      362,
    anchor:   374,
    rotationOffset: Math.PI/12
  },
  {
    url:      'https://raw.githubusercontent.com/DLopezHub/pintacaras/f92039d5913a2d8a490a40335226368f81c7fbb1/03.png',
    scale:    6.0,
    offsetX:  40,
    offsetY:  10,
    start:    33,
    end:      133,
    anchor:   159,
    rotationOffset: 0
  },
  {
    url:      'https://raw.githubusercontent.com/DLopezHub/pintacaras/5b7c033b743f61d8248459bc6b869a8b53730612/04.png',
    scale:    6.0,
    offsetX:   35,
    offsetY:  -5,
    start:    33,
    end:      133,
    anchor:   159,
    rotationOffset: 0
  },
  {
    url:      'https://raw.githubusercontent.com/DLopezHub/pintacaras/65f91cae569ee473802c72a78ff7dcf2e298f9a6/00_v1.png',
    scale:    8.0,
    offsetX: -25,
    offsetY: -40,
    start:    263,
    end:      362,
    anchor:   386,
    rotationOffset: 0
  }
];

// Precarga de imágenes
const designImgs = designConfigs.map(c => {
  const img = new Image();
  img.src = c.url;
  return img;
});

let currentDesign = 0;
// Listeners para los cinco botones
['btn1','btn2','btn3','btn4','btn5'].forEach((id, idx) => {
  document.getElementById(id).addEventListener('click', () => {
    currentDesign = idx;
    document.querySelectorAll('#buttons button').forEach(b => b.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  });
});

const overlay = document.getElementById('overlay');
const video   = document.getElementById('video');
const canvas  = document.getElementById('canvas');
const ctx     = canvas.getContext('2d');

// Inicia AR al tocar overlay
overlay.addEventListener('click', () => {
  overlay.style.display = 'none';
  startAR();
});

async function startAR() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' }, audio: false
    });
    video.srcObject = stream;
    await video.play();

    const faceMesh = new FaceMesh({
      locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`
    });
    faceMesh.setOptions({
      maxNumFaces:            1,
      refineLandmarks:        true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence:  0.5
    });
    faceMesh.onResults(drawDesign);

    (async function loop(){
      await faceMesh.send({ image: video });
      requestAnimationFrame(loop);
    })();

  } catch (err) {
    console.error('Error cámara:', err);
    overlay.innerText = '❌ No se pudo acceder a la cámara';
    overlay.style.display = 'flex';
  }
}

function drawDesign(results) {
  if (!results.multiFaceLandmarks?.length) return;

  canvas.width  = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const cfg = designConfigs[currentDesign];
  const img = designImgs[currentDesign];
  const lm  = results.multiFaceLandmarks[0];

  const p1 = lm[cfg.start];
  const p2 = lm[cfg.end];
  const pa = lm[cfg.anchor];

  const x1 = p1.x * canvas.width,  y1 = p1.y * canvas.height;
  const x2 = p2.x * canvas.width,  y2 = p2.y * canvas.height;
  const xa = pa.x * canvas.width,  ya = pa.y * canvas.height;

  const dx    = x2 - x1;
  const dy    = y2 - y1;
  const eyeW  = Math.hypot(dx, dy);
  const baseA = Math.atan2(dy, dx);
  const ang   = baseA + (cfg.rotationOffset || 0);

  const drawW = eyeW * cfg.scale;
  const drawH = drawW * (img.height / img.width);

  const cx = (x1 + x2)/2 + cfg.offsetX;
  const cy = ya + cfg.offsetY;

  ctx.save();
  ctx.translate(cx, cy);

  ctx.globalAlpha = 0.6;
  ctx.drawImage(img, -drawW/2, -drawH/2, drawW, drawH);
  ctx.restore();
}
