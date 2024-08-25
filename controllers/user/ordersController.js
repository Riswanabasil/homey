const User=require('../../models/userSchema')
const Product=require('../../models/productSchema')
const Order=require('../../models/orderSchema')

const getOrderHistory=async(req,res)=>{
    try {
        const userId = req.session.user;
        const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
        res.render('orders', { orders });
      } catch (error) {
        console.error('Error fetching order history:', error);
        res.status(500).send('Server error');
      }
}
const cancelOrder = async (req, res) => {
    try {
      const orderId = req.params.id;
      const order = await Order.findById(orderId);
      
      if (order.status === 'Order Placed' || order.status === 'Shipped') {

        const user = await User.findById(order.user);
        user.wallet += order.total; 
        await user.save();

      
        for (const item of order.products) {
          await Product.findByIdAndUpdate(item.productId, { $inc: { quantity: item.quantity } });
        }
        order.status = 'Cancelled';
        await order.save();
      }
  
      res.redirect('/orders');
    } catch (error) {
      console.error('Error canceling order:', error);
      res.status(500).send('Server error');
    }
  };
  
  const returnOrder = async (req, res) => {
    try {
      const orderId = req.params.id;
      const order = await Order.findById(orderId);
      
      if (order.status === 'Delivered') {
       
        const user = await User.findById(order.user);
        user.wallet += order.total;  
        await user.save();

        for (const item of order.products) {
          await Product.findByIdAndUpdate(item.productId, { $inc: { quantity: item.quantity } });
        }
        order.status = 'Returned';
        await order.save();
      }
  
      res.redirect('/orders');
    } catch (error) {
      console.error('Error returning order:', error);
      res.status(500).send('Server error');
    }
  };

  
  const viewOrder = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await Order.findById(orderId).populate('products.productId');

        if (!order) {
            return res.status(404).send('Order not found');
        }

        res.render('orderDetails', { order });
    } catch (error) {
        console.error('Error viewing order details:', error);
        res.status(500).send('Server error');
    }
};
module.exports={getOrderHistory, cancelOrder,returnOrder,viewOrder}