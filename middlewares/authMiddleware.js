const User=require("../models/userSchema")
const isAdmin=(req,res,next)=>{
    if(req.session.isAdmin){
        return next()
    }
    return res.redirect('/admin')
}

const isUserBlocked = async (req, res, next) => {
    if (req.session && req.session.user) {
       try {
        const user = await User.findById(req.session.user._id);
        if (user && user.isBlocked) {
          console.log('User is blocked:', user);
          req.session.destroy((err) => {
            if (err) {
              return next(err);
            }
            return res.render('login', { message: 'User is blocked by admin' });
          });
        } else {
          return next();
        }
      } catch (error) {
        return next(error);
      }
    } else {
      return next();
    }
  };
  const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    return res.redirect('/login'); 
};

module.exports={isAdmin, isUserBlocked,isAuthenticated}