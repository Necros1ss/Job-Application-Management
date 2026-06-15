import fs from "fs";
import path from "path";

// This is a simple storage abstraction. 
// Can be extended later for S3, Cloudinary, etc.
export const storageService = {
  saveFile: async (file, uploadDir) => {
    if (!file) return null;
    return `/uploads/${path.basename(uploadDir)}/${file.filename}`;
  },
  
  deleteFile: async (filePath, baseDir) => {
    if (!filePath) return;
    try {
      const absolutePath = path.join(baseDir, filePath);
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
    } catch (error) {
      console.error("Failed to delete file from storage:", error.message);
    }
  }
};