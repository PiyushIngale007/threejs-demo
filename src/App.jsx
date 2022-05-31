import { useState, useEffect } from "react";
import logo from "./logo.svg";
import "./App.css";
import * as THREE from "three";
import starimg from "./assets/star.png";
function App() {
  useEffect(() => {
    initStage();
    initScene();
    initCanvas();
    initCamera();
    createLights();
    initInput();
    animate();
    setTimeout(function () {
      updateText();
    }, 40);

    spaceBackground();
  }, []);

  let height,
    width,
    container,
    scene,
    camera,
    renderer,
    cube,
    particles = [],
    mouseVector = new THREE.Vector3(0, 0, 0),
    mousePos = new THREE.Vector3(0, 0, 0),
    cameraLookAt = new THREE.Vector3(0, 0, 0),
    cameraTarget = new THREE.Vector3(0, 0, 800),
    textCanvas,
    textCtx,
    textPixels = [],
    input;
  let colors = ["#F7A541", "#F45D4C", "#FA2E59", "#4783c3", "#9c6cb7"];

  const initStage = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    container = document.getElementById("stage");
    window.addEventListener("resize", resize);
    container.addEventListener("mousemove", mousemove);
  };

  const initScene = () => {
    scene = new THREE.Scene();
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);
  };

  const randomPos = (vector) => {
    let radius = width * 3;
    let centerX = 0;
    let centerY = 0;

    // ensure that p(r) ~ r instead of p(r) ~ constant
    let r = width + radius * Math.random();
    let angle = Math.random() * Math.PI * 2;

    // compute desired coordinates
    vector.x = centerX + r * Math.cos(angle);
    vector.y = centerY + r * Math.sin(angle);
  };

  const initCamera = () => {
    let fieldOfView = 75;
    let aspectRatio = width / height;
    let nearPlane = 1;
    let farPlane = 3000;
    camera = new THREE.PerspectiveCamera(
      fieldOfView,
      aspectRatio,
      nearPlane,
      farPlane
    );
    camera.position.z = 800;
    console.log(camera.position);
    console.log(cameraTarget);
  };

  const createLights = () => {
    let shadowLight = new THREE.DirectionalLight(0xffffff, 2);
    shadowLight.position.set(20, 0, 10);
    shadowLight.castShadow = true;
    shadowLight.shadowDarkness = 0.01;
    scene.add(shadowLight);

    let light = new THREE.DirectionalLight(0xffffff, 0.5);
    light.position.set(-20, 0, 20);
    scene.add(light);

    let backLight = new THREE.DirectionalLight(0xffffff, 0.8);
    backLight.position.set(0, 0, -20);
    scene.add(backLight);
  };

  function Particle() {
    this.vx = Math.random() * 0.05;
    this.vy = Math.random() * 0.05;
  }

  Particle.prototype.init = function (i) {
    let particle = new THREE.Object3D();
    let geometryCore = new THREE.BoxGeometry(20, 20, 20);
    let materialCore = new THREE.MeshLambertMaterial({
      color: colors[i % colors.length],
    });
    let box = new THREE.Mesh(geometryCore, materialCore);
    box.geometry.__dirtyVertices = true;
    box.geometry.dynamic = true;
    particle.targetPosition = new THREE.Vector3(
      (textPixels[i].x - width / 2) * 4,
      textPixels[i].y * 5,
      -10 * Math.random() + 20
    );
    particle.position.set(width * 0.5, height * 0.5, -10 * Math.random() + 20);
    randomPos(particle.position);

    // for (let i = 0; i < box.geometry.vertices.length; i++) {
    //   box.geometry.vertices[i].x += -10 + Math.random() * 20;
    //   box.geometry.vertices[i].y += -10 + Math.random() * 20;
    //   box.geometry.vertices[i].z += -10 + Math.random() * 20;
    // }

    particle.add(box);

    this.particle = particle;
  };

  Particle.prototype.updateRotation = function () {
    this.particle.rotation.x += this.vx;
    this.particle.rotation.y += this.vy;
  };

  Particle.prototype.updatePosition = function () {
    this.particle.position.lerp(this.particle.targetPosition, 0.02);
  };

  const render = () => {
    renderer.render(scene, camera);
  };

  const updateParticles = () => {
    for (let i = 0, l = particles.length; i < l; i++) {
      particles[i].updateRotation();
      particles[i].updatePosition();
    }
  };

  const setParticles = () => {
    for (let i = 0; i < textPixels.length; i++) {
      if (particles[i]) {
        particles[i].particle.targetPosition.x =
          (textPixels[i].x - width / 2) * 4;
        particles[i].particle.targetPosition.y = textPixels[i].y * 5;
        particles[i].particle.targetPosition.z = -10 * Math.random() + 20;
      } else {
        let p = new Particle();
        p.init(i);
        scene.add(p.particle);
        particles[i] = p;
      }
    }

    for (let i = textPixels.length; i < particles.length; i++) {
      randomPos(particles[i].particle.targetPosition);
    }
  };

  const initCanvas = () => {
    textCanvas = document.getElementById("text");
    textCanvas.style.width = width + "px";
    textCanvas.style.height = 200 + "px";
    textCanvas.width = width;
    textCanvas.height = 200;
    textCtx = textCanvas.getContext("2d");
    textCtx.font = "700 100px Arial";
    textCtx.fillStyle = "#555";
  };

  const initInput = () => {
    input = document.getElementById("input");
    input.value = "EDIT ME";
  };

  const updateText = () => {
    input = document.getElementById("input");

    let fontSize = width / (input.value.length * 1.3);
    if (fontSize > 120) fontSize = 120;
    textCtx.font = "700 " + fontSize + "px Arial";
    textCtx.clearRect(0, 0, width, 200);
    textCtx.textAlign = "center";
    textCtx.textBaseline = "middle";
    textCtx.fillText(input.value.toUpperCase(), width / 2, 50);

    let pix = textCtx.getImageData(0, 0, width, 200).data;
    textPixels = [];
    for (let i = pix.length; i >= 0; i -= 4) {
      if (pix[i] != 0) {
        let x = (i / 4) % width;
        let y = Math.floor(Math.floor(i / width) / 4);

        if (x && x % 6 == 0 && y && y % 6 == 0)
          textPixels.push({
            x: x,
            y: 200 - y + -120,
          });
      }
    }
    setParticles();
  };

  const animate = () => {
    requestAnimationFrame(animate);
    updateParticles();
    camera.position.lerp(cameraTarget, 0.2);
    camera.lookAt(cameraLookAt);

    render();
  };

  const resize = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);

    textCanvas.style.width = width + "px";
    textCanvas.style.height = 200 + "px";
    textCanvas.width = width;
    textCanvas.height = 200;
    updateText();
  };

  const mousemove = (e) => {
    let x = e.pageX - width / 2;
    let y = e.pageY - height / 2;
    cube.position.x = x * -1;
    cube.position.y = y;
    cameraTarget.x = x * -1;
    cameraTarget.y = y;
  };

  const spaceBackground = () => {
    const geometry = new THREE.BufferGeometry();
    const noOfPoints = 1500; //1500;
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(getRandomParticelPos(noOfPoints), 3)
    );

    const loader = new THREE.TextureLoader();
    // create a basic material and set its color
    // const material = new THREE.MeshBasicMaterial({ color: 0x44aa88 });
    const material = new THREE.PointsMaterial({
      size: 0.1,
      map: loader.load(starimg),
      transparent: true,
      // color: 0x44aa88,
    });

    // create a Mesh
    cube = new THREE.Points(geometry, material);
    cube.position.z = 800;

    scene.add(cube);
    console.log(scene);
  };
  const getRandomParticelPos = (particleCount) => {
    const arr = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      arr[i] = (Math.random() - 0.5) * 10;
    }
    return arr;
  };
  return (
    <>
      <div id="stage"></div>

      <input id="input" type="text" onChange={(ev) => updateText()} />
      <canvas id="text" width="700" height="200"></canvas>
    </>
  );
}

export default App;
