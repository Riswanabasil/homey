const Category=require("../../models/categorySchema");
const Product = require("../../models/productSchema");

const getCategories=async (req, res) => {
    const page=parseInt(req.query.page)||1
    const limit=parseInt(req.query.limit)||5
    const skipIndex=(page-1)*limit
    try {
        const categories = await Category.find().limit(limit).skip(skipIndex);
        const totalCategory= await Category.countDocuments()
        res.render('category',{categories,error:'',currentPage: page, totalPages:Math.ceil(totalCategory/limit)});
    } catch (error) {
        res.status(500).send("Server Error");
    }
};

const addCategory=async(req,res)=>{
    const {name,offer}=req.body;
    const categories = await Category.find();
    if (offer < 0 || offer > 100) {
        return res.render('category',{categories,error:"Offer should be between 0 and 100%"})
    }
    try{
        if (!name.trim()) {
            return res.render('category',{categories,error:"Category name cannot be empty"})
        }
        const existCategory= await Category.findOne({ name: new RegExp('^' + name + '$', 'i') })
        if(existCategory){
            return res.render('category',{categories,error:"Category name already exist"})
        }
        const newCategory=new Category({name,offer})
        await newCategory.save()
        res.redirect('/admin/Category')
    }
    catch(error){
        res.status(500).send("server error")
    }
}

const editCategory=async(req,res)=>{
    const {id,name,offer}=req.body
    const categories = await Category.find();
    if (offer < 0 || offer > 100) {
        return res.render('category', {categories, error: "Offer should be between 0 and 100%" });
    }
    try{
        if (!name.trim()) {
            return res.render('category',{categories,error:"Category name cannot be empty"})
        }
        const existCategory= await Category.findOne({ name: new RegExp('^' + name + '$', 'i') })
        if(existCategory){
            return res.render('category',{categories,error:"Category name already exist"})
        }
        await Category.findByIdAndUpdate(id,{name,offer})
        res.redirect('/admin/category')
    }
    catch(error){
        res.status(500).send("server error")
    }
}

const toggleCategoryStatus=async (req, res) => {
    const { id } = req.body;
    try {
        const category = await Category.findById(id);
        const newStatus = !category.isListed; 
        await Category.findByIdAndUpdate(id, { isListed: newStatus });
        await Product.updateMany({category:id},{$set:{isBlocked:!newStatus}})
        res.redirect('/admin/category');
    } catch (error) {
        res.status(500).send('Server Error');
    }
};


module.exports={getCategories,addCategory,editCategory,toggleCategoryStatus}