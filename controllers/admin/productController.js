const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const multer = require('multer');
const path = require('path');
const { query } = require('express');

const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 1000000 }, 
    fileFilter: (req, file, cb) => {
        checkFileType(file, cb);
    }
}).array('files[]',5); 

function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif|avif|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}

exports.getProductPage = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const search = req.query.search || ''

    try {
        const query = search ? { productName: { $regex: search, $options: 'i' } } : {};
        const count = await Product.countDocuments(query);
        const products = await Product.find(query)
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('category');

        res.render('product', {
            products,
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            limit,
            search
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.redirect('/admin/dashboard');
    }
};


exports.getAddEditProductPage = async (req, res) => {
    try {
        const categories = await Category.find({isListed:true});
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
                console.log(req.files);
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
                res.redirect('/admin/product')
                
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

                const product = await Product.findById(req.params.id);

                if (!product) {
                    return res.redirect('/admin/product');
                }


                let productImages = product.productImage;

                // Add new images to the existing array
                if (req.files && req.files.length > 0) {
                    const newImages = req.files.map(file => '/uploads/' + file.filename);
                    productImages = [...productImages, ...newImages];
                }

                product.productName = productName;
                product.description = description;
                product.author = author;
                product.category = category;
                product.regularPrice = regularPrice;
                product.salePrice = salePrice;
                product.productOffer = productOffer;
                product.quantity = quantity;
                // if (productImages) product.productImage = productImages;
                product.productImage = productImages;


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

exports.removeProductImage = async (req, res) => {
    try {
        const { productId, index } = req.body;
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).send('Product not found');
        }

        product.productImage.splice(index, 1);
        await product.save();

        res.status(200).send('Image removed successfully');
    } catch (error) {
        console.error('Error removing image:', error);
        res.status(500).send('Error removing image');
    }
};