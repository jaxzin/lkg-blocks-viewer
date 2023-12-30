import * as React from "react";
import { animated } from "react-spring";
import { Link } from "wouter";

import { VRButton, ARButton, XR, Controllers, Hands } from '@react-three/xr'
import { Canvas } from '@react-three/fiber'
import { useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';

import BlockCard from '../components/BlockCard';

export default function XrTest() {
  
  const texture = useLoader(TextureLoader, "https://cdn.glitch.global/98b2b4e8-ce2c-4c4f-8e0c-3e762cb48276/christmas_tree_2023_qs8x12a0.75.jpg?v=1702708834115");

  //0x808080, 0x606060
  
  return (
    <>
      <VRButton />
      <Canvas sRGB>
        <XR>
          <hemisphereLight skyColor="0x808080" groundColor="0x606060" /> 
          <Controllers />
          <Hands />
          <BlockCard 
              texture={texture}
              width={5}
              height={7.5}
              radius={1}
              borderWidth={1}
              borderColor={"#AAAAFF"}
              quiltRows={8}
              quiltColumns={12}
              maxViewingAngle={0.58}
            />
        </XR>
      </Canvas>
    </>
  )
}