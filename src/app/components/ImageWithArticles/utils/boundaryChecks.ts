import { ImageSize } from "../types";

/**
 * Vérifie si un point (x, y) est à l'intérieur des limites de l'image
 */
export function isInImageBounds(
  x: number,
  y: number,
  imageSize: ImageSize,
  containerWidth: number,
  containerHeight: number,
): boolean {
  if (!imageSize.displayWidth || !imageSize.displayHeight) return false;

  // Calculer les décalages pour centrer l'image
  const unusedWidth = containerWidth - imageSize.displayWidth;
  const unusedHeight = containerHeight - imageSize.displayHeight;
  const offsetX = unusedWidth / 2;
  const offsetY = unusedHeight / 2;

  // Vérifier si le point (x, y) est à l'intérieur de l'image
  const imageLeft = offsetX;
  const imageRight = offsetX + imageSize.displayWidth;
  const imageTop = offsetY;
  const imageBottom = offsetY + imageSize.displayHeight;

  return x >= imageLeft && x <= imageRight && y >= imageTop && y <= imageBottom;
}

/**
 * Contraint une position pour qu'elle reste dans les limites de l'image
 */
export function constrainToImageBounds(
  percentX: number,
  percentY: number,
  widthPercent: number,
  heightPercent: number,
): { positionX: number; positionY: number } {
  const minX = widthPercent / 2;
  const maxX = 100 - widthPercent / 2;
  const minY = heightPercent / 2;
  const maxY = 100 - heightPercent / 2;

  return {
    positionX: Math.max(minX, Math.min(maxX, percentX)),
    positionY: Math.max(minY, Math.min(maxY, percentY)),
  };
}
