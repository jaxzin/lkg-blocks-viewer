import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

export default function Controls({ target, maxViewingAngle }) {
  const { gl, camera } = useThree();
  
  useEffect(() => {
    camera.fov = 5;
    camera.position.set(0,0,5)
    camera.updateProjectionMatrix();
  }, [camera]);

  // Check for XR session
  const isXRSession = gl.xr && gl.xr.isPresenting;

  // Lock rotation around the Z axis
  const angleLimit = (maxViewingAngle * Math.PI) / 180;
  const halfAngleLimit = angleLimit / 2;

  
  // Only render OrbitControls if not in an XR session
  return !isXRSession ? <OrbitControls 
                          enableZoom={true} 
                          enablePan={true} 
                          target={target}
                          enableDamping
                          dampingFactor={0.025}
                          minPolarAngle={Math.PI / 2}
                          maxPolarAngle={Math.PI / 2}
                          minAzumuthAngle={-halfAngleLimit}
                          maxAzimuthAngle={halfAngleLimit}
                          /> : null;

}