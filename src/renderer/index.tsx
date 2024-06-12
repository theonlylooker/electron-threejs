import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import * as THREE from "three";
// import Stats from "stats.js";
import Stats from "three/examples/jsm/libs/stats.module.js";

//Function to create the grid
const createBoxGrid = (
  base: number,
  height: number,
  translateY: number,
  divisions: number,
  color: THREE.ColorRepresentation
) => {
  var boxGrid = new THREE.Group();
  boxGrid.name = "BoxGrid";

  var lineMaterial = new THREE.LineBasicMaterial({ color: color });

  // Create a grid for each face of the box
  const createGridPlane = (
    width: number,
    height: number,
    divisions: number
  ) => {
    var step = width / divisions;
    var halfWidth = width / 2;
    var halfHeight = height / 2;

    var geometry = new THREE.BufferGeometry();
    var vertices = [];

    for (var i = -halfWidth; i <= halfWidth; i += step) {
      vertices.push(i, -halfHeight, 0, i, halfHeight, 0);
    }

    for (var j = -halfHeight; j <= halfHeight; j += step) {
      vertices.push(-halfWidth, j, 0, halfWidth, j, 0);
    }

    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3)
    );
    var lines = new THREE.LineSegments(geometry, lineMaterial);

    return lines;
  };

  var bottomGrid = createGridPlane(base, base, divisions);
  bottomGrid.rotation.x = -Math.PI / 2;
  bottomGrid.position.y = 0;
  boxGrid.add(bottomGrid);

  var topGrid = createGridPlane(base, base, divisions);
  topGrid.rotation.x = Math.PI / 2;
  topGrid.position.y = height;
  boxGrid.add(topGrid);

  var frontGrid = createGridPlane(base, height, divisions);
  frontGrid.position.z = -base / 2;
  frontGrid.position.y = height / 2;
  boxGrid.add(frontGrid);

  var backGrid = createGridPlane(base, height, divisions);
  backGrid.position.z = base / 2;
  backGrid.position.y = height / 2;
  backGrid.rotation.y = Math.PI;
  boxGrid.add(backGrid);

  var leftGrid = createGridPlane(base, height, divisions);
  leftGrid.position.x = -base / 2;
  leftGrid.position.y = height / 2;
  leftGrid.rotation.y = -Math.PI / 2;
  boxGrid.add(leftGrid);

  var rightGrid = createGridPlane(base, height, divisions);
  rightGrid.position.x = base / 2;
  rightGrid.position.y = height / 2;
  rightGrid.rotation.y = Math.PI / 2;
  boxGrid.add(rightGrid);

  boxGrid.translateY(translateY);
  return boxGrid;
};

const App: React.FC = () => {
  const cubeRef = useRef<THREE.Mesh<
    THREE.BoxGeometry,
    THREE.MeshBasicMaterial
  > | null>(null);
  //Create ref to save the states between renders
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const statsRef = useRef<Stats | null>(null);

  //separete initialization from actions
  useEffect(() => {
    initThreeJS();
    initStats();
    window.addEventListener("resize", handleResize);

    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  const initThreeJS = () => {
    const scene = new THREE.Scene();
    // Way 1 background as image
    // const textureLoader = new THREE.TextureLoader();
    // const jailTexture = textureLoader.load("./grid.jpg");
    // scene.background = jailTexture;

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer();
    camera.position.set(0, 0, 5);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    //Cube creation
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      wireframe: true,
    });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(0, 0, -1);
    //Set layer for the raycast
    cube.layers.set(1);
    cubeRef.current = cube;

    //Add cube to scene
    scene.add(cube);

    //way 2 create a box grid
    const grid = createBoxGrid(5, 5, 0, 10, "0x00ff00");
    grid.position.set(0, -2, 2);
    //Set layer to not be detacted for the raycast
    grid.layers.set(0);

    //Add grid to scene
    scene.add(grid);

    //Enable layers
    camera.layers.enable(0);
    camera.layers.enable(1);

    //Set refs
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    animate();
  };

  const initStats = () => {
    const stats = new Stats();
    // 0: fps, 1: ms, 2: memory
    stats.showPanel(0);
    document.body.appendChild(stats.dom);
    statsRef.current = stats;
  };

  //Function to adapt windows (responsiveness)
  const handleResize = () => {
    if (cameraRef.current && rendererRef.current) {
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    }
  };

  //Function to detect hover on object via raycast
  const onMouseMove = (event: MouseEvent) => {
    if (
      !cameraRef.current ||
      !sceneRef.current ||
      !cubeRef.current ||
      !rendererRef.current
    )
      return;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const canvasBounds = rendererRef.current.domElement.getBoundingClientRect();

    //Normalize coordinates
    mouse.x =
      ((event.clientX - canvasBounds.left) / canvasBounds.width) * 2 - 1;
    mouse.y =
      -((event.clientY - canvasBounds.top) / canvasBounds.height) * 2 + 1;

    //Set raycast
    raycaster.setFromCamera(mouse, cameraRef.current);
    //Set layer that will detect the raycast
    raycaster.layers.set(1);
    //Logic for the hover change of color
    const intersects = raycaster.intersectObjects(sceneRef.current.children);
    console.log({ intersects });
    if (intersects.length > 0 && intersects[0].object === cubeRef.current) {
      (cubeRef.current.material as THREE.MeshBasicMaterial).color.set(0xff0000);
    } else {
      (cubeRef.current.material as THREE.MeshBasicMaterial).color.set(0x00ff00);
    }
  };

  const animate = () => {
    requestAnimationFrame(animate);
    //Set animations for the objects
    if (statsRef.current) statsRef.current.begin();

    if (cubeRef.current) cubeRef.current.rotation.y += 0.01;

    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }

    if (statsRef.current) statsRef.current.end();
  };

  //Freeing Memory
  const cleanup = () => {
    if (rendererRef.current) {
      document.body.removeChild(rendererRef.current.domElement);
    }
    if (statsRef.current) {
      document.body.removeChild(statsRef.current.dom);
    }
    window.removeEventListener("resize", handleResize);
  };

  return (
    <>
      <h1>Hello, Electron!</h1>
    </>
  );
};

ReactDOM.render(<App />, document.getElementById("root"));

// add this to the POC responsive and benchmarking performance of cpu
// its preferable to have an gltf2 object exported but its possible to work with obj too if needed
