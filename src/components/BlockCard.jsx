import React, { useRef, useEffect } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { QuiltMaterial } from './QuiltMaterial.js';
import { RoundedRectGeometry } from './RoundedRect.js';


function BlockCard({ textureUrl, width, height, radius, borderWidth, borderColor, quiltRows, quiltColumns, maxViewingAngle, onReady }) {
  const meshRef = useRef();
  const borderRef = useRef();
  const texture = useLoader(THREE.TextureLoader, textureUrl);

  useEffect(() => {
    
    if (meshRef.current) {
      const quiltDims = new THREE.Vector2(quiltRows, quiltColumns);
      
      const material = new QuiltMaterial(texture, quiltDims, maxViewingAngle);
      const geometry = new RoundedRectGeometry(width, height, radius);
      meshRef.current.geometry = geometry;
      meshRef.current.material = material;
    }

    if (borderRef.current) {
      const borderGeometry = new RoundedRectGeometry(width + borderWidth, height + borderWidth, borderWidth);
      borderRef.current.geometry = borderGeometry;
      borderRef.current.material = new THREE.MeshPhongMaterial({
        color: borderColor,
        side: THREE.DoubleSide
      });
      borderRef.current.position.z = -0.001;
    }
    
    if (meshRef.current && borderRef.current) {
      // Once everything is set up
      onReady(meshRef.current); // Invoke the callback with the mesh as an argument
    }
  }, [textureUrl, width, height, radius, borderWidth, borderColor, quiltRows, quiltColumns, maxViewingAngle, onReady]);

  useFrame(({ camera }) => {
    if (meshRef.current && borderRef.current) {
      // Calculate the relative angle between the camera and the object
      const angle = calculateRelativeAngle(camera, meshRef.current);

      // Assuming your QuiltMaterial has a method to update the angle
      meshRef.current.material.setRelativeAngle(angle);
    }
  });
  
  // Helper function to calculate relative angle
  function calculateRelativeAngle(camera, object) {
    // Get the world space position of the object
    let objectWorldPosition = new THREE.Vector3();
    object.getWorldPosition(objectWorldPosition);

    // Calculate the direction from the object to the camera in world space
    let toCameraDirection = new THREE.Vector3().subVectors(camera.position, objectWorldPosition);
    toCameraDirection.y = 0; // Project onto the XZ plane
    toCameraDirection.normalize(); // Re-normalize the vector

    // Get the forward normal of the object in world space
    let objectNormal = new THREE.Vector3(0, 0, 1); // Default forward in local space
    objectNormal.applyQuaternion(object.getWorldQuaternion(new THREE.Quaternion()));
    objectNormal.y = 0; // Project onto the XZ plane
    objectNormal.normalize(); // Re-normalize the vector

    // Calculate the dot product
    let dot = toCameraDirection.dot(objectNormal);

    // Calculate the angle
    let angle = Math.acos(THREE.MathUtils.clamp(dot, -1.0, 1.0));

    // Determine the sign of the angle based on the cross product
    let cross = new THREE.Vector3().crossVectors(toCameraDirection, objectNormal);
    if (cross.y < 0) {
      angle = -angle;
    }

    // The angle is now between -PI and PI
    return angle;
  }

  return (
    <>
      {/* Main content of the card */}
      <mesh ref={meshRef}>
        {/* You don't need to explicitly add geometry or material here since they are managed within the useEffect hook */}
        {/* However, if you have additional elements like texts or icons on the card, you can add them here */}
      </mesh>

      {/* Border of the card */}
      <mesh ref={borderRef} position={[0, 0, -0.001]}>
        {/* Similar to the main content, the geometry and material are set in useEffect */}
        {/* If the border has additional stylistic features, include them here */}
      </mesh>
    </>
  );
}

export default BlockCard;
