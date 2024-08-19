const express=require("express")
const router=express.Router()
const adminController=require("../controllers/admin/adminController")
const categoryController=require("../controllers/admin/categoryController")
const userController=require("../controllers/admin/userController")
const productController=require("../controllers/admin/productController")
const admin=require('../middlewares/authMiddleware')
const ordersController=require('../controllers/admin/ordersController')
const couponController=require('../controllers/admin/couponController')

// admin router
router.get("/",adminController.loadLogin)
router.post("/login",adminController.login)
router.get("/dashboard",admin.isAdmin,adminController.loadDashboard)
router.get("/logout",adminController.logout)

//category router
router.get('/category',admin.isAdmin, categoryController.getCategories)
router.post('/category/add',admin.isAdmin,categoryController.addCategory)
router.post('/category/edit',admin.isAdmin,categoryController.editCategory)
router.post('/category/:id/toggle-status',admin.isAdmin, categoryController.toggleCategoryStatus)

//user router

router.get('/user',admin.isAdmin,userController.getUser)
router.post('/users/:id/toggle-block',admin.isAdmin,userController.toggleUser)

//product router

// Product Management Routes
router.get('/product',admin.isAdmin, productController.getProductPage);
router.get('/product/add',admin.isAdmin, productController.getAddEditProductPage);
router.get('/product/edit/:id',admin.isAdmin, productController.getAddEditProductPage);
router.post('/product/add',admin.isAdmin, productController.addProduct);
router.post('/product/edit/:id',admin.isAdmin, productController.editProduct);
router.post('/product/toggle/:id',admin.isAdmin, productController.toggleProductStatus);
router.post('/product/remove-image', productController.removeProductImage)

//order 

router.get('/orders',admin.isAdmin, ordersController.listOrders);
router.get('/orders/:id', ordersController.viewOrder)
router.post('/orders/:id/status',ordersController.updateOrderStatus)

//coupon

router.get('/coupons',admin.isAdmin,couponController.listCoupons)
router.get('/coupons/add',couponController.loadAddCoupon)
router.post('/coupons/add',couponController.addCoupon)
router.get('/coupons/edit/:id', couponController.editCouponForm);
router.post('/coupons/edit/:id', couponController.updateCoupon);
router.post('/coupons/delete/:couponId', couponController.deleteCoupon)


module.exports=router