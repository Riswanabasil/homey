const User=require("../../models/userSchema")
const env=require("dotenv").config()

const loadLogin=(req,res)=>{
    res.render('adminLogin', { errorMessage: '' })
}
const login=(req,res)=>{
    const { username, password } = req.body
    if (username === process.env.ADMIN_NAME && password === process.env.ADMIN_PASSWORD) {
        req.session.isAdmin = true;
        return res.render('dashboard');
    } else {
        return res.render('adminLogin', {
            errorMessage: 'Invalid email or password'
        });
    }
}

const loadDashboard=(req,res)=>{
    res.render("dashboard")
}

const logout=(req,res)=>{
    req.session.destroy((err) => {
        if (err) {
            return res.redirect('/admin/dashboard');
        }
        res.clearCookie('connect.sid');
        res.redirect('/admin');
    });
}
module.exports={loadLogin,login,loadDashboard,logout}