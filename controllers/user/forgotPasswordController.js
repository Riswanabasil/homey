const User = require('../../models/userSchema');
const { generateOtp, sendVerificationEmail, securePassword } = require('../user/userController')
const bcrypt=require("bcrypt")

const loadForgotPasswordPage = (req, res) => {
    res.render('forgot-password', { message: '' });
};
const sendResetOtp = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.render('forgot-password', { message: 'No account found with this email.' });
        }

        const otp = generateOtp();
        const emailSend = await sendVerificationEmail(email, otp);
        if (!emailSend) {
            return res.render('forgot-password', { message: 'Failed to send OTP. Please try again.' });
        }

        req.session.resetOtp = otp;
        req.session.resetEmail = email;

        res.render('verify-otp1', { message: '' }); 
    } catch (error) {
        console.error('Error sending OTP for password reset:', error);
        res.render('forgot-password', { message: 'An error occurred. Please try again.' });
    }
    
            
            
           
};
const verifyResetOtp = async (req, res) => {
    try {
        const { otp } = req.body;
       
        if(otp.trim() === req.session.resetOtp.trim()){
            return res.status(200).json({ success: true, redirectUrl: '/reset-password' });
       
        }else{
            return res.status(400).json({ success: false, message: 'Invalid OTP, please try again' })
        }
    } catch (error) {
        console.error('Error verifying OTP for password reset:', error);
        res.status(500).json({ success: false, message: 'An error occurred' });
    }
};

const loadResetPassword=(req, res) => {
    res.render('reset-password', { message: '', email: req.session.resetEmail });
};

const resetPassword = async (req, res) => {
    try {
        const { newPassword, confirmNewPassword } = req.body;

        if (!req.session.resetEmail) {
            return res.render('forgot-password', { message: 'Session expired. Please try the password reset process again.' });
        }

        if (newPassword !== confirmNewPassword) {
            return res.render('reset-password', { message: 'Passwords do not match', email: req.session.resetEmail });
        }

        const email = req.session.resetEmail;

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.updateOne({ email }, { password: hashedPassword });

        req.session.resetEmail = null;
        req.session.resetOtp = null;

        res.render('login', { message: 'Password reset successful. You can now log in with your new password.' });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.render('reset-password', { message: 'An error occurred. Please try again.', email: req.session.resetEmail });
    }
};

module.exports={loadForgotPasswordPage, sendResetOtp,verifyResetOtp,loadResetPassword,resetPassword}