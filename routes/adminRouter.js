const express=require("express")
const router=express.Router()
const adminController=require("../controllers/admin/adminController")
const categoryController=require("../controllers/admin/categoryController")
const userController=require("../controllers/admin/userController")
const productController=require("../controllers/admin/productController")

// admin router
router.get("/",adminController.loadLogin)
router.post("/login",adminController.login)
router.get("/dashboard",adminController.loadDashboard)
router.get("/logout",adminController.logout)

//category router
router.get('/category', categoryController.getCategories)
router.post('/category/add',categoryController.addCategory)
router.post('/category/edit',categoryController.editCategory)
router.post('/category/:id/toggle-status', categoryController.toggleCategoryStatus)

//user router

router.get('/user',userController.getUser)
router.post('/users/:id/toggle-block',userController.toggleUser)

//product router

// Product Management Routes
router.get('/product', productController.getProductPage);
router.get('/product/add', productController.getAddEditProductPage);
router.get('/product/edit/:id', productController.getAddEditProductPage);
router.post('/product/add', productController.addProduct);
router.post('/product/edit/:id', productController.editProduct);
router.post('/product/toggle/:id', productController.toggleProductStatus);


module.exports=router