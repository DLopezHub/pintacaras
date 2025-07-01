// === Configuración de cada diseño ===
const designConfigs = [
  {
    url:      'https://raw.githubusercontent.com/DLopezHub/pintacaras/65f91cae569ee473802c72a78ff7dcf2e298f9a6/00_v1.png',
    scale:    8.0,          // factor de escala sobre el ancho del ojo
    offsetX: -25,            // ajuste horizontal en píxeles
    offsetY: -35,            // ajuste vertical en píxeles
    start:   263,            // landmark esquina externa ojo derecho
    end:     362,            // landmark esquina interna ojo derecho
    anchor:  386,            // landmark de anclaje (párpado superior)
    
  },
  {
    url:      'https://raw.githubusercontent.com/DLopezHub/pintacaras/18c4e4b5d26a102939e6e2ab6c9a28c8633fd049/01_.png',
    scale:    6.0,           // distinto escala para el segundo diseño
    offsetX:  0,            // distinto offset
    offsetY:  60,            // lo ponemos debajo del ojo
    start:   263,            // mismas esquinas de ojo
    end:     362,
    anchor:  374,             // párpado inferior para colocarlo debajo
    rotationOffset: Math.PI/12  // 30 grados en radianes
  }
];

// Preload de imágenes
const designImgs = designConfigs.map(c => {
  const img = new Image();
  img.src = c.url;
  return img;
});

let currentDesign = 0;
document.getElementById('btn1').addEventListener('click', () => currentDesign = 0);
document.getElementById('btn2').addEventListener('click', () => currentDesign = 1);

const overlay = document.getElementById('overlay');
const video   = document.getElementById('video');
const canvas  = document.getElementById('canvas');
const ctx     = canvas.getContext('2d');

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

  // Ajusta canvas
  canvas.width  = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const lm  = results.multiFaceLandmarks[0];
  const cfg = designConfigs[currentDesign];
  const img = designImgs[currentDesign];

  // Calcula extremos del ojo
  const pO = lm[cfg.start], pI = lm[cfg.end], pA = lm[cfg.anchor];
  const xO = pO.x * canvas.width,  yO = pO.y * canvas.height;
  const xI = pI.x * canvas.width,  yI = pI.y * canvas.height;
  const xA = pA.x * canvas.width,  yA = pA.y * canvas.height;

  // Ancho y ángulo del ojo
  const dx   = xI - xO;
  const dy   = yI - yO;
  const eyeW = Math.hypot(dx, dy);
  const ang  = Math.atan2(dy, dx);

  // Tamaño del PNG manteniendo proporción
  const drawW = eyeW * cfg.scale;
  const drawH = drawW * (img.height / img.width);

  // Punto de anclaje + offsets
  const cx = (xO + xI)/2 + cfg.offsetX;
  const cy = yA + cfg.offsetY;

  // Dibujo con rotación
  ctx.save();
  ctx.translate(cx, cy);
  ctx.globalAlpha = 0.5;
  ctx.drawImage(img, -drawW/2, -drawH/2, drawW, drawH);
  ctx.restore();
}
