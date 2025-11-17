const PDFDocument = require('pdfkit');

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: process.env.CHECKOUT_CURRENCY?.toUpperCase() || 'USD'
});

function drawHeader(doc, title) {
  doc
    .fontSize(22)
    .text('RunMate', { align: 'center' })
    .moveDown(0.5)
    .fontSize(16)
    .text(title, { align: 'center' })
    .moveDown();
}

function drawOrderInfo(doc, order, customer) {
  doc
    .fontSize(12)
    .text(`Order ID: ${order._id}`)
    .text(`Order Date: ${new Date(order.createdAt).toLocaleString()}`)
    .text(`Customer: ${customer.name || customer.email || 'Customer'}`)
    .text(`Email: ${customer.email || 'N/A'}`)
    .moveDown();

  doc.fontSize(12).text('Shipping Address:', { underline: true });
  const { shippingAddress } = order;
  doc
    .text(shippingAddress.street)
    .text(`${shippingAddress.city}, ${shippingAddress.state}`)
    .text(`${shippingAddress.zipCode}, ${shippingAddress.country}`)
    .moveDown();
}

function drawItemsTable(doc, order) {
  doc.fontSize(12).text('Items', { underline: true }).moveDown(0.5);

  const tableTop = doc.y;
  const itemColumn = 50;
  const quantityColumn = 300;
  const priceColumn = 380;
  const totalColumn = 460;

  doc
    .font('Helvetica-Bold')
    .text('Item', itemColumn, tableTop)
    .text('Qty', quantityColumn, tableTop)
    .text('Price', priceColumn, tableTop)
    .text('Total', totalColumn, tableTop);

  doc.moveDown();
  doc.font('Helvetica');

  order.items.forEach((item) => {
    const y = doc.y;
    doc
      .text(item.productName, itemColumn, y)
      .text(item.quantity.toString(), quantityColumn, y)
      .text(currencyFormatter.format(item.price), priceColumn, y)
      .text(
        currencyFormatter.format(item.price * item.quantity),
        totalColumn,
        y
      )
      .moveDown();
  });

  doc
    .moveDown()
    .font('Helvetica-Bold')
    .text(`Total: ${currencyFormatter.format(order.totalAmount)}`, {
      align: 'right'
    });
}

function generateReceiptPdf(order, customer) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      resolve(Buffer.concat(buffers));
    });
    doc.on('error', reject);

    drawHeader(doc, 'Payment Receipt');
    drawOrderInfo(doc, order, customer);
    drawItemsTable(doc, order);

    doc
      .moveDown()
      .fontSize(10)
      .font('Helvetica')
      .text(
        'Thank you for shopping with RunMate! Please keep this receipt for your records.',
        { align: 'center' }
      );

    doc.end();
  });
}

module.exports = {
  generateReceiptPdf
};


