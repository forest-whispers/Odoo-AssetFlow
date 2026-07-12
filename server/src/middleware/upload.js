import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf",
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
        return cb(null, true);
    }
    cb(new Error("Unsupported file type"));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024, } });

export default upload;