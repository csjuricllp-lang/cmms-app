import * as nodemailer from 'nodemailer';

async function main() {
  console.log('Testing SMTP connection...');
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'cs.juricllp@gmail.com',
      pass: 'omfz mugw yyds bdiy',
    },
  });

  try {
    const info = await transporter.sendMail({
      from: '"CMMS App Alert" <cs.juricllp@gmail.com>',
      to: 'nkdev26@gmail.com',
      subject: 'Test Email from CMMS Local',
      text: 'This is a test email.',
    });
    console.log('Email sent successfully!', info.messageId);
  } catch (err) {
    console.error('Failed to send email:', err);
  }
}

main();
