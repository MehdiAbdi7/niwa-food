import multer from "multer";

// Stockage temporaire en mémoire (le fichier ne touche jamais le disque du serveur,
// il est directement streamé vers Cloudinary depuis le buffer)
const storage = multer.memoryStorage();

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Format d'image non supporté (jpeg, png, webp uniquement)"));
  }
};

export const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo max
  fileFilter,
});
