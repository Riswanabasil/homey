const User=require("../../models/userSchema")

const getUser=async (req,res)=>{
    if (!req.session.isAdmin) {
        return res.redirect('/admin/adminLogin');
    }
    const users = await User.find()
    res.render("user",{users})
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