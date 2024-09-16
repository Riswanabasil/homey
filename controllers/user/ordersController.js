const User=require('../../models/userSchema')
const Product=require('../../models/productSchema')
const Order=require('../../models/orderSchema')
const PDFDocument=require('pdfkit')

const getOrderHistory=async(req,res)=>{
    try {
        const userId = req.session.user;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5; 
        const skipIndex = (page - 1) * limit;
        const orders = await Order.find({ user: userId }).populate('products.productId').sort({ createdAt: -1 }).limit(limit).skip(skipIndex).exec();

        const totalOrders = await Order.countDocuments({ user: userId });
        
        res.render('orders', { orders, currentPage: page,
          totalPages: Math.ceil(totalOrders / limit),});
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

        user.walletTransactions.push({
          date: new Date(), 
          type: 'credit',  
          amount: order.total,  
          description: 'Refund for cancel product'
      });

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

        user.walletTransactions.push({
          date: new Date(), 
          type: 'credit',  
          amount: order.total,  
          description: 'Refund for return product'
      });

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
      const userId = req.session.user;
      const user = await User.findById(userId);
        const orderId = req.params.orderId;
        const order = await Order.findById(orderId).populate('products.productId');

        if (!order) {
            return res.status(404).send('Order not found');
        }

        res.render('orderDetails', { order,user });
    } catch (error) {
        console.error('Error viewing order details:', error);
        res.status(500).send('Server error');
    }
};


const downloadInvoice = async (req, res) => {
  try {
    const orderId = req.params.orderId;
console.log(req.params.orderId)
  
    const order = await Order.findOne({ orderId: orderId })
      .populate('user')
      .populate('products.productId')
      .populate('address')
      .lean();

    if (!order) {
      return res.status(404).send('Order not found');
    }

    const doc = new PDFDocument({ size: 'A4', margin: 30 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice_${orderId}.pdf`);

    doc.pipe(res);

    
    doc.fontSize(18).text('Invoice', { align: 'center' });
    doc.moveDown(1.5);

  
    doc.fontSize(12).text(`Order ID: ${order.orderId}`);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
    doc.moveDown(1);

    
    doc.text(`Customer: ${order.user.name}`);
    doc.text(`Email: ${order.user.email}`);
    doc.moveDown(1);

    doc.text('Shipping Address:', { underline: true });
    doc.text(`${order.address.name}`);
    doc.text(`${order.address.city}, ${order.address.state}`);
    doc.text(`${order.address.pincode}`);
    doc.text(`${order.address.landMark}`);
    doc.moveDown(1);

    const columnPositions = {
      product: 50,
      quantity: 200,
      price: 300,
      total: 400
    };

    doc.fontSize(10).fillColor('#444444');
    doc.text('Product', columnPositions.product, undefined, { continued: true });
    doc.text('Quantity', columnPositions.quantity, undefined, { continued: true });
    doc.text('Price', columnPositions.price, undefined, { continued: true });
    doc.text('Total', columnPositions.total);
    doc.moveDown(0.5);
    doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(columnPositions.product, doc.y).lineTo(columnPositions.total + 50, doc.y).stroke();
    doc.moveDown(1);

    order.products.forEach(item => {
      doc.text(item.productId.productName, columnPositions.product, undefined, { continued: true });
      doc.text(item.quantity, columnPositions.quantity, undefined, { continued: true });
      doc.text(`₹${item.price}`, columnPositions.price, undefined, { continued: true });
      doc.text(`₹${item.price * item.quantity}`, columnPositions.total);
      doc.moveDown(1);
    });

    
    const summaryPosition = columnPositions.total - 30; 

    doc.moveDown(2);
    doc.fontSize(12).fillColor('#000000');
    doc.text(`Discount: ₹${order.discount}`, summaryPosition, undefined, { align: 'right' });
    // doc.text(`Total Price: ₹${order.subtotal}`, summaryPosition, undefined, { align: 'right' });
    doc.text(`Final Amount: ₹${order.total}`, summaryPosition, undefined, { align: 'right' });

    doc.end();
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    res.status(500).json({ success: false, message: 'Error generating invoice PDF' });
  }
};



module.exports={getOrderHistory, cancelOrder,returnOrder,viewOrder,downloadInvoice}