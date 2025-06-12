// Utilitaires pour la compression et gestion d'images côté client

/**
 * Compresse une image en gardant une qualité acceptable
 * @param file - Le fichier image à compresser
 * @param maxWidth - Largeur maximum (défaut: 1920px)
 * @param maxHeight - Hauteur maximum (défaut: 1080px)
 * @param quality - Qualité de compression (0-1, défaut: 0.8)
 * @param maxSizeBytes - Taille maximum en bytes (défaut: 2MB)
 * @returns Promise<File> - Le fichier compressé
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8,
  maxSizeBytes: number = 2 * 1024 * 1024 // 2MB
): Promise<File> {
  return new Promise((resolve, reject) => {
    // Si le fichier est déjà assez petit, on le retourne tel quel
    if (file.size <= maxSizeBytes) {
      resolve(file);
      return;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      // Calculer les nouvelles dimensions en gardant le ratio
      let { width, height } = img;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      // Définir la taille du canvas
      canvas.width = width;
      canvas.height = height;

      // Dessiner l'image redimensionnée
      ctx?.drawImage(img, 0, 0, width, height);

      // Convertir en blob avec compression
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Erreur lors de la compression de l'image"));
            return;
          }

          // Si c'est encore trop gros, on réduit la qualité
          if (blob.size > maxSizeBytes && quality > 0.1) {
            // Recommencer avec une qualité réduite
            compressImage(
              file,
              maxWidth,
              maxHeight,
              quality - 0.1,
              maxSizeBytes
            )
              .then(resolve)
              .catch(reject);
            return;
          }

          // Créer un nouveau fichier avec le blob compressé
          const compressedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          });

          resolve(compressedFile);
        },
        file.type,
        quality
      );
    };

    img.onerror = () => {
      reject(new Error("Erreur lors du chargement de l'image"));
    };

    // Charger l'image
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Valide le type et la taille d'un fichier image
 * @param file - Le fichier à valider
 * @param maxSizeBytes - Taille maximum autorisée (défaut: 5MB)
 * @returns Objet avec isValid et error message
 */
export function validateImageFile(
  file: File,
  maxSizeBytes: number = 5 * 1024 * 1024 // 5MB
): { isValid: boolean; error?: string } {
  // Vérifier le type de fichier
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: "Format d'image non supporté. Utilisez JPG, PNG, GIF ou WebP",
    };
  }

  // Vérifier la taille
  if (file.size > maxSizeBytes) {
    const maxSizeMB = Math.round(maxSizeBytes / (1024 * 1024));
    return {
      isValid: false,
      error: `L'image ne doit pas dépasser ${maxSizeMB} Mo`,
    };
  }

  return { isValid: true };
}

/**
 * Formate la taille d'un fichier en format lisible
 * @param bytes - Taille en bytes
 * @returns String formatée (ex: "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
