import { useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

export default function Controls() {
  const { gl } = useThree();

  // Check for XR session
  const isXRSession = gl.xr && gl.xr.isPresenting;
  
  gl.camera.fov = 5;

  // Only render OrbitControls if not in an XR session
  return !isXRSession ? <OrbitControls enableZoom={true} enablePan={true} /> : null;

}