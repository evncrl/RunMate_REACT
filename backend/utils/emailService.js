const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SMTP_SECURE
  } = process.env;

  if (!SMTP_HOST) {
    throw new Error('SMTP_HOST is not configured');
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT ? Number(SMTP_PORT) : 587,
    secure: SMTP_SECURE === 'true',
    auth: SMTP_USER
      ? {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
      : undefined
  });

  return transporter;
};

// --- Ito 'yung luma mong function ---
const buildReceiptEmail = (order) => {
  return `
Thank you for your purchase!
Order ID: ${order._id}
Total Amount: ${order.totalAmount.toFixed(2)}
Payment Method: ${order.paymentMethod}
You can also view this order anytime by logging in to your RunMate account.
  `;
};

async function sendOrderReceipt({ to, order, pdfBuffer }) {
  // ... (walang binago sa function na 'to) ...
  const mailer = getTransporter();
  const from = process.env.SMTP_FROM || 'RunMate <no-reply@runmate.com>';

  await mailer.sendMail({
    from,
    to,
    subject: `Your RunMate receipt - Order ${order._id}`,
    text: buildReceiptEmail(order),
    attachments: [
      {
        filename: `runmate-receipt-${order._id}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ]
  });
}


// --- EMAIL ---
async function sendOrderStatusUpdate(options) {
  const { to, order } = options;
  const mailer = getTransporter();
  const from = process.env.SMTP_FROM || 'RunMate <no-reply@runmate.com>';

  // TABLE ROWS PARA SA MGA PRODUCTS
  const productListHtml = order.items.map(item => {
    const itemTotal = (item.price * item.quantity).toFixed(2);
    const productName = item.product ? item.product.name : 'Product';
    return `
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd;">${productName}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">$${itemTotal}</td>
      </tr>
    `;
  }).join('');

  // HTML EMAIL TEMPLATE
  const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .container { width: 90%; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .header { font-size: 24px; color: #333; }
        .status { font-size: 20px; font-weight: bold; color: #007bff; margin: 15px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f4f4f4; }
        .total { text-align: right; font-size: 1.2em; font-weight: bold; margin-top: 20px; }
        .footer { margin-top: 20px; color: #777; font-size: 0.9em; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1 class="header">Your Order Status is Updated</h1>
        <p>Hi ${order.user.name},</p>
        <p>Good news! The status of your RunMate order (#${order._id.toString().slice(-8)}) is now:</p>
        <p class="status">${order.status.toUpperCase()}</p>
        
        <h2 style="font-size: 18px; border-bottom: 2px solid #eee; padding-bottom: 5px;">Order Summary</h2>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th style="text-align: center;">Quantity</th>
              <th style="text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${productListHtml}
          </tbody>
        </table>
        
        <div class="total">
          <strong>Grand Total: $${order.totalAmount.toFixed(2)}</strong>
        </div>
        
        <p class="footer">Thank you for shopping with us!!</p>
        <p class="footer">Takbo kana hanggang ma-Tegi!!</p>
      </div>
    </body>
    </html>
  `;

  // FALLBACK TEXT VERSION
  const emailText = `
Hi ${order.user.name},
Good news! The status of your RunMate order (#${order._id.toString().slice(-8)}) has been updated.
New Status: ${order.status.toUpperCase()}
Here is a summary of your order:
${order.items.map(i => `- ${i.product ? i.product.name : 'Product'} (x${i.quantity}) - $${(i.price * i.quantity).toFixed(2)}`).join('\n')}
Grand Total: $${order.totalAmount.toFixed(2)}
Thank you for shopping with us!
  `;

  // EMAIL SEND
  try {
    await mailer.sendMail({
      from,
      to,
      subject: `Your RunMate Order Status: ${order.status.toUpperCase()}`,
      text: emailText, // plain text fallback
      html: emailHtml  // HTML design
    });
    console.log('Order status HTML email sent successfully via Mailtrap');
  } catch (error) {
    console.error('Error sending order status email:', error);
  }
}

module.exports = {
  sendOrderReceipt,
  sendOrderStatusUpdate
};