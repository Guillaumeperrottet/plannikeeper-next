import { ImageSize, PositionWithSize } from "../types";

/**
 * Convertit des coordonnées en pixels vers des pourcentages
 */
export function pixelsToPercent(
  position: PositionWithSize,
  imageSize: ImageSize,
  containerWidth: number,
  containerHeight: number,
): { positionX: number; positionY: number } {
  // Calculer les décalages pour centrer l'image
  const unusedWidth = containerWidth - imageSize.displayWidth;
  const unusedHeight = containerHeight - imageSize.displayHeight;
  const offsetX = unusedWidth / 2;
  const offsetY = unusedHeight / 2;

  // Convertir les coordonnées pixels en pourcentages
  const percentX = ((position.x - offsetX) / imageSize.displayWidth) * 100;
  const percentY = ((position.y - offsetY) / imageSize.displayHeight) * 100;

  return {
    positionX: percentX,
    positionY: percentY,
  };
}

/**
 * Convertit des pourcentages vers des coordonnées en pixels
 */
export function percentToPixels(
  percentX: number,
  percentY: number,
  width: number,
  height: number,
  imageSize: ImageSize,
  containerWidth: number,
  containerHeight: number,
): PositionWithSize {
  // Calculer les décalages pour centrer l'image
  const unusedWidth = containerWidth - imageSize.displayWidth;
  const unusedHeight = containerHeight - imageSize.displayHeight;
  const offsetX = unusedWidth / 2;
  const offsetY = unusedHeight / 2;

  // Convertir les pourcentages en pixels
  const xPos = (percentX / 100) * imageSize.displayWidth + offsetX;
  const yPos = (percentY / 100) * imageSize.displayHeight + offsetY;
  const w = (width / 100) * imageSize.displayWidth;
  const h = (height / 100) * imageSize.displayHeight;

  return {
    x: xPos,
    y: yPos,
    width: w,
    height: h,
  };
}

/**
 * Contraint une valeur entre un min et un max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
