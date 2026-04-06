import { Suspense, useLayoutEffect } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Stage, useTexture } from "@react-three/drei";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import {
  Color,
  DoubleSide,
  Mesh,
  MeshStandardMaterial,
  NoColorSpace,
  Vector2,
} from "three";

/** AdobeStock construction helmet — cleaned OBJ (no `adobe_mdllib` line); vertices in cm → metres */
const OBJ_URL = "/models/construction_worker_hat_clean.obj";
const CM_TO_M = 0.01;

/** Normal map only — base colour is solid safety yellow (plastic hard hat) */
const NORMAL_MAP_URL =
  "/models/construction_worker_hat_1414/construction_worker_hat_1414_Mat_normal.png";

const HARD_HAT_YELLOW = new Color("#f4c518");
const PLASTIC = { metalness: 0.06, roughness: 0.58 };

function HelmetModel() {
  const obj = useLoader(OBJLoader, OBJ_URL);
  const [normalMap] = useTexture([NORMAL_MAP_URL]);

  useLayoutEffect(() => {
    normalMap.colorSpace = NoColorSpace;
    normalMap.flipY = false;

    obj.traverse((child) => {
      if (!(child as Mesh).isMesh) return;
      const mesh = child as Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.material = new MeshStandardMaterial({
        color: HARD_HAT_YELLOW.clone(),
        normalMap,
        normalScale: new Vector2(0.9, 0.9),
        roughness: PLASTIC.roughness,
        metalness: PLASTIC.metalness,
        side: DoubleSide,
      });
    });
  }, [obj, normalMap]);

  return (
    <group scale={[CM_TO_M, CM_TO_M, CM_TO_M]}>
      <primitive object={obj} />
    </group>
  );
}

function Scene() {
  return (
    <>
      <Suspense fallback={null}>
        <Stage
          adjustCamera={1.25}
          intensity={0.55}
          shadows={false}
          environment={null}
          preset="soft"
        >
          <HelmetModel />
        </Stage>
      </Suspense>
      <OrbitControls
        makeDefault
        enablePan={false}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI - 0.2}
        minDistance={0.12}
        maxDistance={12}
        enableDamping
        dampingFactor={0.06}
        rotateSpeed={0.7}
        zoomSpeed={0.85}
      />
    </>
  );
}

export function HelmetViewer() {
  return (
    <div className="helmet-viewer">
      <Canvas
        className="helmet-viewer__canvas"
        camera={{ position: [0, 0.4, 1.8], fov: 45, near: 0.01, far: 200 }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
        dpr={[1, 2]}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
