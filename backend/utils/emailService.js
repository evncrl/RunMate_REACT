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

module.exports = {
  sendOrderReceipt
};


