import * as React from "react";
import { animated } from "react-spring";
import { Link } from "wouter";

import { VRButton, ARButton, XR, Controllers, Hands } from '@react-three/xr'
import { Canvas } from '@react-three/fiber'

import BlockCard from '../components/BlockCard';

export default function XrTest() {
  return (
    <>
      <VRButton />
      <Canvas>
        <XR>
          <Controllers />
          <Hands />
          <mesh>
            <boxGeometry />
            <meshBasicMaterial color="blue" />
          </mesh>
          <BlockCard 
              textureUrl={'https://cdn.glitch.global/98b2b4e8-ce2c-4c4f-8e0c-3e762cb48276/christmas_tree_2023_qs8x12a0.75.jpg?v=1702708834115'}
              width={0.2}
              height={0.3}
              radius={0.02}
              borderWidth={0.02}
              borderColor={"#AAAAFF"}
              quiltDims={{x:6, y:9}}
              maxViewingAngle={0.58}
            />
        </XR>
      </Canvas>
    </>
  )
}