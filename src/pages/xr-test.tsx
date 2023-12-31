import * as React from "react";
import { animated } from "react-spring";
import { Link } from "wouter";

import { VRButton, ARButton, XR, Controllers, Hands } from '@react-three/xr'
import { Canvas, useThree } from '@react-three/fiber'
import { useLoader } from '@react-three/fiber';
import { TextureLoader, Group } from 'three';

import BlockCard from '../components/BlockCard';
import CardPreviewControls from '../components/CardPreviewControls';


import { PerspectiveCamera, OrbitControls } from '@react-three/drei'

export default function XrTest() {
  
  const groupRef = React.useRef();
  const controlsRef = React.useRef();

  
  const texture = useLoader(TextureLoader, "https://cdn.glitch.global/98b2b4e8-ce2c-4c4f-8e0c-3e762cb48276/christmas_tree_2023_qs8x12a0.75.jpg?v=1702708834115");
  
  const maxViewingAngle = 58.0;
  
  React.useEffect(() => {
    console.log("Group ref:" , groupRef.current);
    console.log("Controls ref:", controlsRef.current);
    if (groupRef.current && controlsRef.current) {
      controlsRef.current.target.copy(groupRef.current.position);
      alert("test")
      controlsRef.current.update();
      return () => controlsRef.current.dispose(); // Clean up controls when the component unmounts
    }
  }, [groupRef, controlsRef]);
  
  React.useEffect(() => {
    console.log("Group ref after mount:", groupRef.current);
    console.log("Controls ref after mount:", controlsRef.current);
  });
  
  return (
    <>
      <VRButton />
      <Canvas style={{ width: "100vw", height: "90vh" }}>
        <XR>
          
          <hemisphereLight 
              skyColor="#808080" 
              groundColor="#606060" />
          <ambientLight intensity={0.7}/>
          <directionalLight 
            position={[0,200,0]}
            castShadow
            shadow-mapSize={[4096,4096]}>
            <orthographicCamera attach="shadow-camera" args={[-200, 200, 200, -200]} />
          </directionalLight>

          <Controllers />
          <Hands />
          <group position={[0, 0, -2.5]} ref={groupRef}>
            <BlockCard
                texture={texture}
                width={.15}
                height={.2}
                radius={.01}
                borderWidth={.0125}
                borderColor={"#AAAAFF"}
                quiltRows={8}
                quiltColumns={12}
                maxViewingAngle={maxViewingAngle}
              />
          </group>
          
          <CardPreviewControls ref={controlsRef}
              maxViewingAngle={maxViewingAngle} 
            />

        </XR>
      </Canvas>
    </>
  )
}