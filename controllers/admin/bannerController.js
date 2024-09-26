const Banner=require('../../models/bannerSchema')
const multer = require('multer');
const path = require('path');



exports.getAllBanners = async (req, res) => {
    try {
        const banner = await Banner.findOne(); 
        res.render('bannerView', { banner });
      } catch (error) {
        console.error('Error fetching banner:', error);
        res.status(500).send('Server error');
      }
};



// Multer configuration for handling file uploads
const storage = multer.diskStorage({
    destination: './public/uploads/banners',
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 1000000 },
}).single('bannerImage'); // Single file upload

// Add banner controller
exports.addBanner = (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            console.error('Error uploading file:', err);
            return res.status(500).send('File upload error');
        }

        try {
            const { title, description } = req.body;
            const bannerImage = `/uploads/banners/${req.file.filename}`;

            const newBanner = new Banner({
                title,
                description,
                bannerImage
            });

            await newBanner.save();
            res.redirect('/admin/banner'); // Redirect to the banner view page
        } catch (error) {
            console.error('Error adding banner:', error);
            res.status(500).send('Server error');
        }
    });
};
exports.getEditBannerPage = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        if (!banner) {
            return res.status(404).send('Banner not found');
        }
        res.render('editBanner', { banner });
    } catch (error) {
        console.error('Error fetching banner:', error);
        res.status(500).send('Server error');
    }
};
exports.editBanner = (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            console.error('Error uploading file:', err);
            return res.status(500).send('File upload error');
        }

        try {
            const { title, description } = req.body;
            let bannerImage = req.body.currentImage; // Default to the current image if no new image is uploaded

            // If a new banner image is uploaded, replace the old one
            if (req.file) {
                bannerImage = `/uploads/banners/${req.file.filename}`;
            }

            await Banner.findByIdAndUpdate(req.params.id, {
                title,
                description,
                bannerImage
            });

            res.redirect('/admin/banner');
        } catch (error) {
            console.error('Error editing banner:', error);
            res.status(500).send('Server error');
        }
    });
};