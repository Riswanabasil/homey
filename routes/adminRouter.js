const express=require("express")
const router=express.Router()
const adminController=require("../controllers/admin/adminController")
const categoryController=require("../controllers/admin/categoryController")
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

module.exports=router