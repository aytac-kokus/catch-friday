import * as THREE from './vendor/three.module.js';

function material(color) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.83 });
}

function roundedBadge(label) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  context.fillStyle = '#e4f2ab';
  context.beginPath();
  context.roundRect(5, 5, 502, 246, 36);
  context.fill();
  context.fillStyle = '#203521';
  context.font = '900 112px system-ui, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(label, 256, 136, 440);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(
    new THREE.PlaneGeometry(0.97, 0.48),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true }),
  );
}

export function makeScene(canvas, label, still) {
  const context = canvas.getContext('webgl2', { antialias: true, alpha: false });
  if (!context) return null;
  const renderer = new THREE.WebGLRenderer({ canvas, context, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#dbeddf');
  const camera = new THREE.OrthographicCamera(-5, 5, 2, -2, 0.1, 100);
  camera.position.set(0, 5.8, 10);
  camera.lookAt(0, 0.72, 0);

  scene.add(new THREE.HemisphereLight(0xfff4db, 0x8fa988, 2.05));
  const sun = new THREE.DirectionalLight(0xfff0d2, 2);
  sun.position.set(-3, 8, 6);
  scene.add(sun);

  const palette = {
    desk: material(0x93bdab),
    rail: material(0x315c53),
    lime: material(0x9dc63f),
    ink: material(0x223a2c),
    cream: material(0xfff5ce),
    shell: material(0xffb944),
    filling: material(0x5e9b3e),
    tomato: material(0xd95037),
  };

  function box(parent, size, style, position) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), style);
    mesh.position.set(...position);
    parent.add(mesh);
    return mesh;
  }

  box(scene, [8.85, 0.28, 2.15], palette.desk, [0, -0.14, 0]);
  box(scene, [8.85, 0.09, 0.07], palette.rail, [0, 0.01, 1.02]);
  box(scene, [8.85, 0.09, 0.07], palette.rail, [0, 0.01, -1.02]);

  for (let offset = -4; offset <= 4; offset += 1) {
    box(scene, [0.42, 0.009, 0.065], palette.cream, [offset, 0.01, 0.75]);
  }

  const target = new THREE.Mesh(new THREE.RingGeometry(0.46, 0.56, 40), new THREE.MeshBasicMaterial({ color: 0x24543f }));
  target.rotation.x = -Math.PI / 2;
  target.position.y = 0.022;
  scene.add(target);

  const traveler = new THREE.Group();
  scene.add(traveler);
  box(traveler, [1.16, 0.93, 0.49], palette.lime, [0, 0.66, 0]);
  box(traveler, [0.41, 0.095, 0.17], palette.ink, [0, 1.28, 0]);
  for (const x of [-0.16, 0.16]) box(traveler, [0.08, 0.19, 0.16], palette.ink, [x, 1.16, 0]);
  const tag = roundedBadge(label);
  tag.position.set(0, 0.59, 0.251);
  traveler.add(tag);

  for (const x of [-0.22, 0.22]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.092, 14, 10), palette.cream);
    eye.position.set(x, 0.94, 0.27);
    traveler.add(eye);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.041, 10, 8), palette.ink);
    pupil.position.set(x + 0.02, 0.94, 0.345);
    traveler.add(pupil);
  }
  const feet = [-0.29, 0.29].map((x) => box(traveler, [0.21, 0.16, 0.41], palette.ink, [x, 0.08, 0.03]));

  const taco = new THREE.Group();
  scene.add(taco);
  const shape = new THREE.Shape();
  shape.absarc(0, 0, 0.48, 0, Math.PI, false);
  shape.lineTo(0.48, 0);
  for (const z of [-0.17, 0.16]) {
    const shell = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shape, {
        depth: 0.043, bevelEnabled: true, bevelSize: 0.021, bevelThickness: 0.021, bevelSegments: 1,
      }),
      palette.shell,
    );
    shell.position.z = z;
    taco.add(shell);
  }
  for (let index = -2; index <= 2; index += 1) {
    const filling = new THREE.Mesh(new THREE.IcosahedronGeometry(0.14, 1), index % 2 ? palette.tomato : palette.filling);
    filling.position.set(index * 0.16, 0.37 - Math.abs(index) * 0.042, 0.03);
    filling.scale.set(1, 0.78, 1.28);
    taco.add(filling);
  }
  taco.rotation.y = -0.31;

  function resize() {
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;
    const aspect = width / height;
    const horizontal = Math.max(4.8, 2.2 * aspect);
    const vertical = horizontal / aspect;
    camera.left = -horizontal;
    camera.right = horizontal;
    camera.top = vertical;
    camera.bottom = -vertical;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  function draw(round) {
    const moving = round.phase === 'running' || round.phase === 'dropping';
    const gait = moving && !still ? Math.sin(round.elapsed / 68) : 0;
    traveler.position.set(round.x, Math.abs(gait) * 0.073, 0);
    traveler.rotation.z = round.phase === 'caught' ? -0.11 : gait * 0.053;
    if (round.phase === 'dodged') traveler.rotation.z = -Math.sign(round.x) * 0.23;
    feet[0].rotation.x = gait * 0.4;
    feet[1].rotation.x = -gait * 0.4;
    taco.visible = round.phase !== 'escaped';
    taco.position.set(0, 2.42 * (1 - round.fall ** 2), 0.31);
    taco.rotation.z = still ? 0 : 0.19 * (1 - round.fall);
    target.material.color.set(round.phase === 'missed' ? 0x9a441f : 0x24543f);
    renderer.render(scene, camera);
  }

  return { resize, draw };
}
