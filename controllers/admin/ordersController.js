const User=require('../../models/userSchema')
const Product=require('../../models/productSchema')
const Order=require('../../models/orderSchema')

const listOrders = async (req, res) => {
    const page= parseInt(req.query.page)||1
    const limit= parseInt(req.query.limit)||10
    const skipIndex=(page-1)*limit
    try {
        const totalOrders= await Order.countDocuments()
        const orders = await Order.find().populate('user').sort({ createdAt: -1 }).limit(limit).skip(skipIndex);
        res.render('adminOrders', { orders,page,
            totalPages: Math.ceil(totalOrders / limit) });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).send('Server error');
    }
};
const viewOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('user').populate('products.productId');
        res.render('adminOrderDetails', { order });
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).send('Server error');
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).send('Order not found');
        }

        
        if (status === 'Cancelled') {
            
            for (let item of order.products) {
                const product = await Product.findById(item.productId);
                product.quantity += item.quantity;
                await product.save();
            }
        }

        order.status = status;

        await order.save();

        res.redirect(`/admin/orders/${req.params.id}`);
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).send('Server error');
    }
};
module.exports={listOrders,viewOrder,updateOrderStatus}