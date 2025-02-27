const User=require("../../models/userSchema")
const env=require("dotenv").config()
const Order=require('../../models/orderSchema')
const Product=require('../../models/productSchema')
const Category=require('../../models/categorySchema')

const loadLogin=(req,res)=>{
    res.render('adminLogin', { errorMessage: '' })
}
const login=(req,res)=>{
    const { username, password } = req.body
    if (username === process.env.ADMIN_NAME && password === process.env.ADMIN_PASSWORD) {
        req.session.isAdmin = true;
        return res.redirect('/admin/dashboard');
    } else {
        return res.render('adminLogin', {
            errorMessage: 'Invalid email or password'
        });
    }
}

const loadDashboard=async (req, res) => {
    try {
        const filter = req.query.timePeriod || 'daily'; 


    
        const salesData = await getSalesData(filter);

        
        const topProducts = await Order.aggregate([
            { $unwind: "$products" }, 
            { $group: { 
                _id: "$products.productId",  
                totalSales: { $sum: "$products.quantity" }  
            }},
            { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } }, 
            { $unwind: "$product" },  
            { $project: { productName: "$product.productName", totalSales: 1 } }, 
            { $sort: { totalSales: -1 } }, 
            { $limit: 10 }
        ]);

        
        const topCategories = await Order.aggregate([
            { $unwind: "$products" }, 
            { $lookup: { from: "products", localField: "products.productId", foreignField: "_id", as: "productDetails" } }, 
            { $unwind: "$productDetails" },  
            { $lookup: { from: "categories", localField: "productDetails.category", foreignField: "_id", as: "categoryDetails" } }, 
            { $unwind: "$categoryDetails" }, 
            { $group: { 
                _id: "$categoryDetails.name", 
                totalSales: { $sum: "$products.quantity" } 
            }},
            { $sort: { totalSales: -1 } },
            { $limit: 10 } 
        ]);

        

        res.render('dashboard', {
            salesData,
            topProducts,
            topCategories,
            filter 
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).send('Server Error');
    }
};



async function getSalesData(timePeriod) {
    let matchQuery = {};
    const currentDate = new Date();
    if (timePeriod === 'daily') {
        const startOfDay = new Date(currentDate.setHours(0, 0, 0, 0)); 
        const endOfDay = new Date(currentDate.setHours(23, 59, 59, 999)); 
        matchQuery = {
            createdAt: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        };
    }else if (timePeriod === 'weekly') {
        const currentDate = new Date(); 
        const endDate = new Date(currentDate); 
    
        
        endDate.setDate(currentDate.getDate() - 6);
    
        
        currentDate.setHours(23, 59, 59, 999); 
        endDate.setHours(0, 0, 0, 0); 
        
        matchQuery = {
            createdAt: {
                $gte: endDate, 
                $lte: currentDate 
            }
        };
    
    }  else if (timePeriod === 'monthly') {
        
        const yearStart = new Date(currentDate.getFullYear(), 0, 1);  
        matchQuery = {
            createdAt: {
                $gte: yearStart  
            }}
    } else if (timePeriod === 'yearly') {
        matchQuery = {
            createdAt: {
                $gte: new Date(currentDate.setMonth(0, 1)) 
            }
        };
    }

    

    const sales = await Order.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: (timePeriod === 'monthly')
                    ? { $dateToString: { format: "%Y-%m", date: "$createdAt" } }  
                    : { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },  
                totalSales: { $sum: "$total" }
            }
        },
        { $sort: { _id: 1 } }  
    ]);
    return sales;
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