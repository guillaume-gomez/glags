import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
 import {
  generateGeometriesByNumberOfColors as utilGenerateFlagsByPixelsColorOccurance,
  originalPositionMeshes
} from "colors2geometries";
import useOpenCV from "../customHooks/useOpenCV";
import useAnimationFrame from "../customHooks/useAnimationFrame";
import { useFullscreen   } from "rooks";
import { createPlane, createLights, create3dPointLighting } from "./threejsUtils";

interface ThreeCanvasProps {
  filename: string;
  width: number;
  height: number;
  velocity: number;
  alignMeshes: boolean;
}

const MAX_Z = 0.3;
const MIN_Z = 0;

function ThreeCanvas({filename, velocity, width, height, alignMeshes} : ThreeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scene = useRef(new THREE.Scene());
  const groupRef = useRef<THREE.Group|null>(null);
  const groupRefDirections = useRef<number[]>([]);
  const camera = useRef<THREE.PerspectiveCamera | null>(null);
  const renderer = useRef<THREE.WebGLRenderer| null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [originalPositionsZ, setOriginalPositionsZ] = useState<number[]>([]);
  const { play, stop } = useAnimationFrame(animate);
  const {
    toggle
  } = useFullscreen();


  useEffect(() => {
    if(canvasRef.current && camera.current && renderer.current && width && height) {
      camera.current.aspect = width / height;
      camera.current.updateProjectionMatrix();
      //magic number here
      renderer.current.setSize(width, height);
    }
  }, [width, height]);



  useEffect(() => {
    if(canvasRef.current) {
      // Sizes
      const sizes = {
          width: window.innerWidth,
          height: window.innerHeight
      }
      scene.current.background = new THREE.Color( 0xe9d5e9 );


      // Camera
      camera.current = new THREE.PerspectiveCamera(75, sizes.width / sizes.height);
      camera.current.position.set( 0, 0.75, 2 );
      scene.current.add(camera.current);


      // Renderer
      renderer.current = new THREE.WebGLRenderer({
          canvas: canvasRef.current
      });

      renderer.current.setSize(sizes.width, sizes.height);

      // Controls
      const controls = new OrbitControls( camera.current, renderer.current.domElement );
      controls.enablePan = true;

      scene.current.add(createPlane());
      scene.current.add(createLights());
    }
  }, [canvasRef]);

  useEffect(() => {
    if(filename) {
      setLoading(true);
      // clear scenes
      console.log(scene.current.children)
      while(scene.current.children.length > 0) {
        scene.current.remove(scene.current.children[0]);
      }
      groupRef.current = null;
      console.log(scene.current.children)
      scene.current.add(createPlane());
      scene.current.add(createLights());
      scene.current.add(generateFlagsByPixelsColorOccurance(filename));
      setLoading(false);

    }
  }, [filename, setLoading]);

  useEffect(() => {
    if(!groupRef.current) {
      return;
    }

    if(alignMeshes) {
      groupRef.current.children.forEach((child : any, index: number) => {
        child.position.z = index * 0.0001;
      });
    } else {
      groupRef.current.children.forEach((child : any, index: number) => {
        child.position.z = originalPositionsZ[index];
      });
    }
  }, [alignMeshes])

  useEffect(() => {
    stop();
    play();
  }, [velocity])

  function animate(deltaTime: number) {
    if(renderer.current && scene.current && camera.current) {
      renderer.current.render(scene.current, camera.current);
      if(groupRef.current) {
        groupRef.current.children.forEach((flagItem, index) => {
          if(flagItem.position.z > MAX_Z) {
            groupRefDirections.current[index] = -1;
          }
          if(flagItem.position.z < MIN_Z) {
            groupRefDirections.current[index] = 1;
          }
          flagItem.position.z += groupRefDirections.current[index] * velocity;
        });
      }
    }
  }

  // find all the colors in the image and run findcountours based on this colors
  function generateFlagsByPixelsColorOccurance(imageDomId: string) : THREE.Group {
    const meshes = utilGenerateFlagsByPixelsColorOccurance(imageDomId);
    setOriginalPositionsZ(originalPositionMeshes(meshes).map(position => position.z));

    let group = new THREE.Group();
    group.name = "MY_FLAG_GROUP";
    group.add(...meshes);

    const bbox = new THREE.Box3().setFromObject(group);
    group.position.set(-(bbox.min.x + bbox.max.x) / 2, -(bbox.min.y + bbox.max.y), -(bbox.min.z + bbox.max.z) / 2);

    // add ref for the render
    groupRef.current = group;
    // store the direction for move
    groupRefDirections.current = group.children.map(flagItem => 1);
    return group;
  }

  return (
    <div>
      { loading ? <button className="btn loading lg:absolute md:static lg:top-1/2 lg:left-1/2">loading</button> : <></> }
      <canvas ref={canvasRef} className="webgl" onDoubleClick={e => toggle(e.target as any)}></canvas>
    </div>
  );
}

export default ThreeCanvas;
