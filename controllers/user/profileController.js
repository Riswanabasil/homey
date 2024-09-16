const User=require("../../models/userSchema")
const bcrypt=require('bcrypt')
const Address=require('../../models/addressSchema')


const loadProfile = async (req, res) => {
    try {
      let cartCount = '';
      if (req.session.user) {
          const user = await User.findById(req.session.user);
          cartCount = user.cart.reduce((acc, item) => acc + item.quantity, '');
      }
        const user = await User.findById(req.session.user).populate('addresses').exec()
        res.render('profile', { user ,message:'',cartCount});
    } catch (error) {
        console.error('Error loading profile:', error);
        res.status(500).send('Server error');
    }
};
const loadEditProfile = async (req, res) => {
    try {
      const user = await User.findById(req.session.user);
      res.render("editProfile", { user });
    } catch (error) {
      console.error("Error loading edit profile page:", error);
      res.redirect("/profile");
    }
  };

  const updateProfile = async (req, res) => {
    try {
      const { name, email, phone } = req.body;
      const user = await User.findById(req.session.user);
      user.name = name;
      user.email = email;
      user.phone = phone;
      await user.save();
      res.redirect("/profile");
    } catch (error) {
      console.error("Error updating profile:", error);
      res.redirect("/edit-profile");
    }
  };

  
  const verifyPassword = async (req, res) => {
    try {
      const { currentPassword } = req.body;
      const user = await User.findById(req.session.user);
  
      const passwordMatch = await bcrypt.compare(currentPassword, user.password);
      if (passwordMatch) {
        return res.json({ success: true });
      } else {
        return res.json({ success: false });
      }
    } catch (error) {
      console.error("Error verifying password:", error);
      res.status(500).json({ success: false });
    }
  };
  
  const resetPassword = async (req, res) => {
    try {
      const { newPassword, confirmNewPassword } = req.body;
      const user = await User.findById(req.session.user);
  
      if (newPassword !== confirmNewPassword) {
        return res.render("profile", { user, message: "New passwords do not match" });
      }
  
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();
  
      res.render("profile", { user, message: "Password updated successfully" });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.redirect("/profile");
    }
  };
  

  const addAddress = async (req, res) => {
    if (!req.session.user) {
        console.error("User is not authenticated.");
        return res.redirect('/login');
    }

    try {
        const address = new Address({
            user: req.session.user,  
            ...req.body
        });
        await address.save();

        const user = await User.findById(req.session.user);
        user.addresses.push(address._id);
        await user.save();

        // res.redirect('/profile');

        const referrer = req.query.referrer || 'profile';
        res.redirect(`/${referrer}`);
    } catch (error) {
        console.error("Error in addAddress:", error);
        res.status(500).send('Server error');
    }
};

const editAddress = async (req, res) => {
  try {
    const addressId = req.params.id;
    const updatedData = req.body;
    await Address.findByIdAndUpdate(addressId, updatedData);
    res.redirect('/profile');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};


const loadEditAddress = async (req, res) => {
  try {
    const address = await Address.findById(req.params.id);
   
    res.render('editAddress', { address });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};

const removeAddress = async (req, res) => {
  try {
    const addressId = req.params.id;
    await Address.findByIdAndDelete(addressId);
    await User.findByIdAndUpdate(req.session.user.id, { $pull: { addresses: addressId } });
    
    res.status(200).send('Address deleted successfully')
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};
const loadEditAddress1 = async (req, res) => {
  try {
    const address = await Address.findById(req.params.id);
   
    res.render('editAddress1', { address });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};
const editAddress1 = async (req, res) => {
  try {
    const addressId = req.params.id;
    const updatedData = req.body;
    await Address.findByIdAndUpdate(addressId, updatedData);
    res.redirect('/checkout');
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};

module.exports={loadProfile,
   loadEditProfile,
    updateProfile,
    verifyPassword,
    resetPassword,
    addAddress,editAddress,
    loadEditAddress,
    removeAddress,
    loadEditAddress1,
    editAddress1}