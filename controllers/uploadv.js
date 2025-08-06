const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Video Storage config
const videoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'newsletter_uploads/videos',
    allowed_formats: ['mp4', 'mov', 'webm'],
    resource_type: 'video', // 💡 IMPORTANT for videos
  },
});

const uploadVideoMiddleware = multer({ storage: videoStorage });

exports.uploadVideo = [
  uploadVideoMiddleware.single('video'),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No video uploaded' });
    }
    res.status(200).json({ url: req.file.path });
  }
];