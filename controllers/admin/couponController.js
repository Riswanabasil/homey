const Coupon=require('../../models/couponSchema')

const listCoupons=async(req,res)=>{
    const page=parseInt(req.query.page)||1
    const limit=parseInt(req.query.limit)||5
    const skipIndex=(page-1)*limit
    try {
        const totalCoupon= await Coupon.countDocuments()
        const coupons= await Coupon.find().sort({expiry:1}).limit(limit).skip(skipIndex)
         const message = req.query.message || ''
         res.render('listCoupon', { message, coupons, currentPage:page,totalPages:Math.ceil(totalCoupon/limit) });
    } catch (error) {
        console.error('Error listing coupon:', error)
        res.status(500).send('server error')
        ;
    }
}
const loadAddCoupon=async(req,res)=>{
    try {
        res.render('addCoupon')
    } catch (error) {
        console.error('Error loading add coupon:', error)
        res.status(500).send('server error')
    }
}

const addCoupon= async (req, res) => {
    try {
        const { name, expiry, value, minimumPurchase } = req.body;
        const newCoupon = new Coupon({ name, expiry, value, minimumPurchase });
        await newCoupon.save();
        res.redirect('/admin/coupons?message=Coupon added successfully!')
    } catch (error) {
        console.error('Error adding coupon:', error);
        res.redirect('/admin/coupons?message=Error fetching coupon for add!')
    }
};

const editCouponForm=async(req,res)=>{
    try {
        const coupon=await Coupon. findById(req.params.id)
        if(!coupon){
            res.redirect('/admin/coupons?message=coupon not found!')
        }
        res.render('editCoupon',{coupon})
    } catch (error) {
        console.error('Error fetching coupon for edit:',error)
        res.redirect('/admin/coupons?message=Error fetching coupon for edit!')
    }
}

const updateCoupon=async(req,res)=>{
    try {
        const {name, expiry,value, minimumPurchase} =req.body
        await Coupon.findByIdAndUpdate(req.params.id,{
            name,  expiry,value, minimumPurchase
        })
        res.redirect('/admin/coupons?message=Coupon updated successfully!')
    } catch (error) {
        console.error('Error updating coupon:',error)
        res.redirect('admin/coupons?message=Error updating coupon!')
    }
}


const deleteCoupon = async (req, res) => {
    try {
        const couponId = req.params.couponId;
        await Coupon.findByIdAndDelete(couponId);
        res.redirect('/admin/coupons?message=Coupon deleted successfully!');
    } catch (error) {
        console.error('Error deleting coupon:', error);
        res.redirect('/admin/coupons?message=Error while deleting coupon!');
    }
};

const checkName=async (req, res) => {
    const { name } = req.query;
    const coupon = await Coupon.findOne({ name: name });
    if (coupon) {
        res.json({ isUnique: false });
    } else {
        res.json({ isUnique: true });
    }
};

module.exports={listCoupons, loadAddCoupon, addCoupon,editCouponForm,updateCoupon,deleteCoupon,checkName}