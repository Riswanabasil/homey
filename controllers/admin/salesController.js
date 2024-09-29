const Order=require("../../models/orderSchema")
const Product=require("../../models/productSchema")
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

const loadSales=async(req,res)=>{
    try {
       
        res.render('salesReport',{orders:[]})
    } catch (error) {
        console.error("error accessing the sales report:",error)
        res.status(500).send('Server error occurred while loading the sales report page.')
    }
}

const fetchSalesData = async (req, res) => {
    try {
        const { startDate, endDate, period } = req.query;

        let filter = {};
        if (period && period !== 'Default') {
            let now = new Date();
            switch (period) {
                case 'Last 1 Day':
                    filter.createdAt = { $gte: new Date(now.setDate(now.getDate() - 1)), $lte: new Date() };
                    break;
                case 'Last 1 Week':
                    filter.createdAt = { $gte: new Date(now.setDate(now.getDate() - 7)), $lte: new Date() };
                    break;
                case 'Last 1 Month':
                    filter.createdAt = { $gte: new Date(now.setMonth(now.getMonth() - 1)), $lte: new Date() };
                    break;
                case 'Last 1 Year':
                    filter.createdAt = { $gte: new Date(now.setFullYear(now.getFullYear() - 1)), $lte: new Date() };
                    break;
            }
        } else if (startDate && endDate) {
            filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }else if (period === 'Default' && (!startDate || !endDate)) {
            return res.json({ error: true, message: 'Please select a date range or choose a period other than Default.' });
        }
        const orders = await Order.find(filter).populate('products.productId');

        let totalSales = 0, totalAmount = 0, totalDiscount = 0;
        orders.forEach(order => {
            totalSales += 1;
            order.products.forEach(product => {
                totalAmount += product.price * product.quantity;
                totalDiscount += product.appliedOffer; 
            });
        });


        const response = {
            summary: {
                totalSales: totalSales,
                totalAmount: totalAmount,
                totalDiscount: totalDiscount.toFixed(2)
            },
            orders: orders.map(order => ({
                date: order.createdAt.toISOString().substring(0, 10),
                orderId: order.orderId,
                coupon: order.discount,
                products: order.products.map(product => ({
                    name: product.productId.productName,
                    quantity: product.quantity,
                    discount: product.appliedOffer,
                    total: product.price
                }))
            }))
        };

        return res.json(response);
       
    } catch (error) {
        console.error('Error fetching sales data:', error);
        res.status(500).send('Error generating sales report');
    }
};

async function getOrders(startDate, endDate, period) {
    let filter = {};
    if (period && period !== 'Default') {
        let now = new Date();
        switch (period) {
            case 'Last 1 Day':
                filter.createdAt = { $gte: new Date(now.setDate(now.getDate() - 1)), $lte: new Date() };
                break;
            case 'Last 1 Week':
                filter.createdAt = { $gte: new Date(now.setDate(now.getDate() - 7)), $lte: new Date() };
                break;
            case 'Last 1 Month':
                filter.createdAt = { $gte: new Date(now.setMonth(now.getMonth() - 1)), $lte: new Date() };
                break;
            case 'Last 1 Year':
                filter.createdAt = { $gte: new Date(now.setFullYear(now.getFullYear() - 1)), $lte: new Date() };
                break;
        }
    } else if (startDate && endDate) {
        filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    try {
        const orders = await Order.find(filter).populate('products.productId');
        return orders.map(order => ({
            date: order.createdAt.toISOString().substring(0, 10),
            orderId: order.orderId.toString(),  
            coupon: order.discount,
            products: order.products.map(product => ({
                name: product.productId.productName, 
                quantity: product.quantity,
                discount: product.appliedOffer,
                total: product.price 
            }))
        }));
        
    } catch (error) {
        console.error('Error fetching orders for PDF generation:', error);
        throw error;
    }
}


const downloadPdf = async (req, res) => {
    const { startDate, endDate, period } = req.query;

    try {
        const orders = await getOrders(startDate, endDate, period);

        if (!orders || orders.length === 0) {
            return res.status(404).send("No orders found for the specified criteria.");
        }
        
        const doc = new PDFDocument({ margin: 50 });
        res.setHeader('Content-Disposition', 'attachment; filename="sales-report.pdf"');
        res.setHeader('Content-Type', 'application/pdf');
        doc.pipe(res);

        doc.fontSize(16).text('Sales Report', { align: 'center' });
        doc.moveDown(2);

        const columnPositions = {
            date: 50,
            orderId: 150,
            product: 350,
            quantity: 420,
            price: 480
        };


        // Headers
        doc.fontSize(12);
        doc.text('Date', columnPositions.date, 80);
        doc.text('Order ID', columnPositions.orderId, 80);
        doc.text('Product', columnPositions.product, 80);
        doc.text('Quantity', columnPositions.quantity, 80);
        doc.text('Price', columnPositions.price, 80);
        doc.moveDown();

        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);

        orders.forEach(order => {
            doc.fontSize(10);
            order.products.forEach(product => {
                const currentY = doc.y;
                doc.text(order.date, columnPositions.date,currentY);
                doc.text(order.orderId, columnPositions.orderId,currentY);
                doc.text(product.name, columnPositions.product,currentY);
                doc.text(product.quantity.toString(), columnPositions.quantity,currentY);
                let total = product.total ? `${product.total.toFixed(2)}` : 'N/A';
                doc.text(total, columnPositions.price,currentY);
                doc.moveDown(0.5);
            });
            doc.moveDown(1);
        });

        doc.end();
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('Server error occurred while generating the PDF');
    }
};



const downloadExcel = async (req, res) => {
    const { startDate, endDate, period } = req.query;

    try {
        const orders = await getOrders(startDate, endDate, period);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report');

        worksheet.columns = [
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Order ID', key: 'orderId', width: 25 },
            { header: 'Product', key: 'name', width: 30 },
            { header: 'Quantity', key: 'quantity', width: 10 },
            { header: 'Discount', key: 'discount', width: 10 },
            { header: 'Total', key: 'total', width: 15 }
        ];

        orders.forEach(order => {
            order.products.forEach(product => {
                worksheet.addRow({
                    date: order.date,
                    orderId: order.orderId,
                    name: product.name,
                    quantity: product.quantity,
                    discount: product.discount,
                    total: product.total.toFixed(2)
                });
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="sales_report.xlsx"');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error generating Excel file:', error);
        res.status(500).send('Server error occurred while generating the Excel file');
    }
};

module.exports={loadSales,fetchSalesData,downloadPdf,downloadExcel}