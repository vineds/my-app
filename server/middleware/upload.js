const path = require('path');
const fs = require('fs');
const multer = require('multer');

const AVATAR_DIR = path.join(__dirname, '..', '..', 'uploads', 'avatars');
if (!fs.existsSync(AVATAR_DIR)) fs.mkdirSync(AVATAR_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, AVATAR_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, `user-${req.user.id}-${Date.now()}${ext}`);
  }
});

const ALLOWED = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']);

const avatarUpload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED.has(ext)) {
      return cb(new Error('Unsupported file type. Use PNG, JPG, GIF, WEBP, or SVG.'));
    }
    cb(null, true);
  }
});

module.exports = { avatarUpload, AVATAR_DIR };
