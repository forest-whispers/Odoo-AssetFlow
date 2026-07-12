import streamifier from "streamifier";

import cloudinary from "../config/cloudinary.js";

export const uploadFile = (file, folder) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: "auto",
            },
            (error, result) => {
                if (error) {
                    return reject(error);
                }
                resolve(result);
            },
        );
        streamifier
            .createReadStream(file.buffer)
            .pipe(uploadStream);
    });
};