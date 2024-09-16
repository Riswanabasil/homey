const User=require("../../models/userSchema")

const getUser=async (req,res)=>{
    const page=parseInt(req.query.page)||1
    const limit=parseInt(req.query.limit)||8
    const skipIndex=(page-1)*limit
    if (!req.session.isAdmin) {
        return res.redirect('/admin/adminLogin');
    }
    const totalUsers= await User.countDocuments()
    const users = await User.find().limit(limit).skip(skipIndex)
    res.render("user",{users,currentPage:page,totalPages:Math.ceil(totalUsers/limit)})
}

const toggleUser=async (req, res) => {
    if (!req.session.isAdmin) {
        return res.redirect('/admin/adminLogin');
    }
    const user = await User.findById(req.params.id);
    user.isBlocked = !user.isBlocked;
    await user.save();
    res.redirect('/admin/user');
}
module.exports={getUser, toggleUser}