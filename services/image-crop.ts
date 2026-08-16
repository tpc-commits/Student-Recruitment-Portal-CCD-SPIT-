import type { Area } from "react-easy-crop";

function loadImage(imageUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The selected picture could not be opened."));
    image.src = imageUrl;
  });
}

export async function createProfilePhoto(imageUrl: string, crop: Area, originalName: string) {
  const image = await loadImage(imageUrl);
  const canvas = document.createElement("canvas");
  const outputSize = 800;
  canvas.width = outputSize;
  canvas.height = outputSize;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("The picture editor could not start.");

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    outputSize,
    outputSize,
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => result ? resolve(result) : reject(new Error("The cropped picture could not be created.")),
      "image/jpeg",
      0.92,
    );
  });
  const baseName = originalName.replace(/\.[^.]+$/, "") || "profile-photo";
  return new File([blob], `${baseName}-cropped.jpg`, { type: "image/jpeg" });
}
