import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

export default function Controls({target}) {
  const { gl, camera } = useThree();
  
  useEffect(() => {
    camera.fov = 5;
    camera.position.set(0,0,5)
    camera.updateProjectionMatrix();
  }, [camera]);

  // Check for XR session
  const isXRSession = gl.xr && gl.xr.isPresenting;
  
  // Only render OrbitControls if not in an XR session
  return !isXRSession ? <OrbitControls enableZoom={true} enablePan={true} target={target} /> : null;

}