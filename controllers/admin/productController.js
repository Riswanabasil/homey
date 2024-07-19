const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 1000000 }, // limit file size to 1MB
    fileFilter: (req, file, cb) => {
        checkFileType(file, cb);
    }
}).array('productImage', 3); // Allow up to 3 images

function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}

exports.getProductPage = async (req, res) => {
    try {
        const products = await Product.find().populate('category');
        res.render('product', { products });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.redirect('/admin/dashboard');
    }
};

exports.getAddEditProductPage = async (req, res) => {
    try {
        const categories = await Category.find();
        const product = req.params.id ? await Product.findById(req.params.id) : null;
        res.render('addEditProduct', { product, categories });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.redirect('/admin/product');
    }
};

exports.addProduct = (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            console.error('Error uploading files:', err);
            res.redirect('/admin/product');
        } else {
            try {
                const { productName, description, category, regularPrice, salePrice, productOffer, quantity } = req.body;
                const productImages = req.files.map(file => '/uploads/' + file.filename);

                const newProduct = new Product({
                    productName,
                    description,
                    category,
                    regularPrice,
                    salePrice,
                    productOffer,
                    quantity,
                    productImage: productImages,
                    status: 'Active'
                });

                await newProduct.save();
                res.redirect('/admin/product');
            } catch (error) {
                console.error('Error adding product:', error);
                res.redirect('/admin/product');
            }
        }
    });
};

exports.editProduct = (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            console.error('Error uploading files:', err);
            res.redirect('/admin/product');
        } else {
            try {
                const { productName, description, author, category, regularPrice, salePrice, productOffer, quantity } = req.body;
                const productImages = req.files.length ? req.files.map(file => '/uploads/' + file.filename) : undefined;

                const product = await Product.findById(req.params.id);

                product.productName = productName;
                product.description = description;
                product.author = author;
                product.category = category;
                product.regularPrice = regularPrice;
                product.salePrice = salePrice;
                product.productOffer = productOffer;
                product.quantity = quantity;
                if (productImages) product.productImage = productImages;

                await product.save();
                res.redirect('/admin/product');
            } catch (error) {
                console.error('Error editing product:', error);
                res.redirect('/admin/product');
            }
        }
    });
};

exports.toggleProductStatus = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        product.isBlocked = !product.isBlocked;
        await product.save();
        res.redirect('/admin/product');
    } catch (error) {
        console.error('Error toggling product status:', error);
        res.redirect('/admin/product');
    }
};