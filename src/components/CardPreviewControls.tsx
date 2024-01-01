import {useEffect, forwardRef, Ref, ComponentProps, ForwardedRef} from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { PerspectiveCamera } from "three";

// Define the props interface
interface CardPreviewControlsProps {
  maxViewingAngle: number; // Define the type of maxViewingAngle
  // Include other props here as needed
}

const CardPreviewControls = forwardRef((props :CardPreviewControlsProps, ref :ComponentProps<typeof OrbitControls>['ref']) => {
  const { gl, camera} = useThree();

  // Assert that the camera is a PerspectiveCamera
  const perspectiveCamera = camera as PerspectiveCamera;

  useEffect(() => {
    perspectiveCamera.fov = 5;
    perspectiveCamera.position.set(0,0,0)
    perspectiveCamera.updateProjectionMatrix();
  }, [perspectiveCamera]);

  // Check for XR session
  const isXRSession = gl.xr && gl.xr.isPresenting;

  // Lock rotation around the Z axis
  const angleLimit = (props.maxViewingAngle * Math.PI) / 180;
  const halfAngleLimit = angleLimit / 2;
  
  // Only render OrbitControls if not in an XR session
  return !isXRSession ? <OrbitControls ref={ref}
                          enableZoom={false} 
                          enablePan={false} 
                          enableDamping
                          dampingFactor={0.025}
                          minPolarAngle={Math.PI / 2}
                          maxPolarAngle={Math.PI / 2}
                          minAzimuthAngle={-halfAngleLimit}
                          maxAzimuthAngle={halfAngleLimit}
                          /> : null;

})

export default CardPreviewControls;