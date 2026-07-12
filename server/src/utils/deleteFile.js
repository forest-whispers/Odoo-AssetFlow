import cloudinary from "../config/cloudinary.js";

export const deleteFile = async (publicId) => {
    if (!publicId) {
        return;
    }
    await cloudinary.uploader.destroy(publicId);
};