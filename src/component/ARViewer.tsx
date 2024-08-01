import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface ARViewerProps {
  detections: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    confidence: number;
    class: string;
  }>;
}

const ARViewer: React.FC<ARViewerProps> = ({ detections }) => {
  const arRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    arRef.current?.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const video = document.createElement("video");
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;
    videoRef.current = video;

    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      video.srcObject = stream;
      video.onloadedmetadata = () => {
        video.play();
      };
    });

    const texture = new THREE.VideoTexture(video);
    const planeGeometry = new THREE.PlaneGeometry(16, 9); // Aspect ratio of video
    const planeMaterial = new THREE.MeshBasicMaterial({ map: texture });
    const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
    scene.add(planeMesh);

    const createTextTexture = (text: string): THREE.Texture => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (context) {
        context.font = "Bold 32px Arial";
        const textWidth = context.measureText(text).width;
        canvas.width = textWidth;
        canvas.height = 50; // Adjust as needed
        context.font = "Bold 32px Arial";
        context.fillStyle = "violet";
        context.fillText(text, 0, 40);

        return new THREE.CanvasTexture(canvas);
      }
      return new THREE.Texture(); // Fallback empty texture
    };

    const updateDetections = () => {
      // Clear old meshes
      scene.children.forEach((child) => {
        if (child instanceof THREE.Mesh && child !== planeMesh) {
          scene.remove(child);
        }
      });

      detections.forEach((detection) => {
        if (detection.class === "missing") {
          const box = new THREE.BoxGeometry(
            detection.width,
            detection.height,
            1
          );
          const material = new THREE.MeshBasicMaterial({
            color: "violet",
            wireframe: true,
          });
          const mesh = new THREE.Mesh(box, material);
          mesh.position.set(detection.x, detection.y, 0);
          scene.add(mesh);

          const textTexture = createTextTexture(
            `${Math.round(detection.confidence * 100)}%`
          );
          const textGeometry = new THREE.PlaneGeometry(2, 1); // Adjust size as needed
          const textMaterial = new THREE.MeshBasicMaterial({
            map: textTexture,
            transparent: true,
          });
          const textMesh = new THREE.Mesh(textGeometry, textMaterial);
          textMesh.position.set(
            detection.x,
            detection.y + detection.height / 2 + 1,
            0
          );
          scene.add(textMesh);
        }
      });
    };

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
      updateDetections();
    };

    animate();

    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      if (videoRef.current) {
        const stream = videoRef.current.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
      }
      arRef.current?.removeChild(renderer.domElement);
    };
  }, [detections]);

  return <div ref={arRef} className="ar-viewer"></div>;
};

export default ARViewer;
