"use client";

import { useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { createProfilePhoto } from "../../services/image-crop";

interface ProfilePhotoCropperProps {
  imageUrl: string;
  originalName: string;
  onCancel: () => void;
  onConfirm: (file: File) => void;
}

export default function ProfilePhotoCropper({ imageUrl, originalName, onCancel, onConfirm }: ProfilePhotoCropperProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function applyCrop() {
    if (!croppedArea) return;
    setIsApplying(true);
    setErrorMessage("");
    try {
      onConfirm(await createProfilePhoto(imageUrl, croppedArea, originalName));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "The crop could not be applied.");
    } finally {
      setIsApplying(false);
    }
  }

  return (
    <section className="photo-crop-editor" aria-labelledby="crop-photo-title">
      <div className="crop-editor-heading"><div><strong id="crop-photo-title">Resize and crop your photo</strong><p>Drag the picture to center your face, then use the slider to zoom.</p></div><button type="button" onClick={onCancel} aria-label="Close picture editor">×</button></div>
      <div className="crop-stage">
        <Cropper
          image={imageUrl}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_area, pixels) => setCroppedArea(pixels)}
        />
      </div>
      <div className="crop-controls"><label>Zoom<input type="range" min={1} max={3} step={0.05} value={zoom} onChange={(event) => setZoom(Number(event.target.value))} /></label><div><button className="onboarding-back" type="button" onClick={onCancel}>Cancel</button><button className="onboarding-next" type="button" disabled={!croppedArea || isApplying} onClick={() => void applyCrop()}>{isApplying ? "Applying…" : "Use cropped photo"}</button></div></div>
      {errorMessage && <p className="onboarding-error" role="alert">{errorMessage}</p>}
    </section>
  );
}
