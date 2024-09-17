const cloudinary = require("cloudinary").v2;
const fs = require("fs");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// const uploadFile = async (file) => {
//     return new Promise((resolve) => {
//         cloudinary.uploader.upload(file, (result) => {
//             resolve({
//                 url: result.url,
//                 public_id: result.public_id,
//             });
//         });
//     });
// };

const uploadFile = async (localPath) => {
  try {
    console.log("localPath :>> ", localPath);
    const response = await cloudinary.uploader.upload(localPath, {
      resource_type: "image",
      folder: "images",
    });

    fs.unlinkSync(localPath);

    return response;
  } catch (error) {
    console.log("Error while uploading image to cloudinary", error.message);
    fs.unlinkSync(localPath);
    return null;
  }
};

module.exports = { uploadFile };
