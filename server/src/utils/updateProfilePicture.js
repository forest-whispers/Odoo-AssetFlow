import { uploadFile } from "./uploadFile.js";
import { deleteFile } from "./deleteFile.js";

export const updateProfilePicture = async ( profile, file, folder ) => {
    if (profile.profilePicture?.publicId) {
        await deleteFile( profile.profilePicture.publicId, );
    }
    const uploadedFile = await uploadFile( file, folder, );
    profile.profilePicture = {
        url: uploadedFile.secure_url,
        publicId: uploadedFile.public_id,
    };
    await profile.save();
    return profile;
};