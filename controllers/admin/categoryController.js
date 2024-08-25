const Category=require("../../models/categorySchema")

const getCategories=async (req, res) => {
    try {
        const categories = await Category.find();
        res.render('category',{categories});
    } catch (error) {
        res.status(500).send("Server Error");
    }
};

const addCategory=async(req,res)=>{
    const {name,offer}=req.body;
    try{
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
    try{
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
        res.redirect('/admin/category');
    } catch (error) {
        res.status(500).send('Server Error');
    }
};
module.exports={getCategories,addCategory,editCategory,toggleCategoryStatus}