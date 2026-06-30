import nodemailer from 'nodemailer';

const createTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error('EMAIL_USER and EMAIL_PASS must be configured');
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user,
      pass,
    },
  });
};

export const sendVerificationEmail = async ({ to, name, verificationCode }) => {
  const transporter = createTransporter();
  const from = process.env.EMAIL_FROM || `"ProFacture" <${process.env.EMAIL_USER}>`;
  const displayCode = String(verificationCode || '').replace(/(\d{3})(\d{3})/, '$1 $2');

  await transporter.sendMail({
    from,
    to,
    subject: 'Your ProFacture verification code',
    text: `Hello ${name || ''},\n\nYour ProFacture verification code is: ${verificationCode}\n\nThis code expires in 24 hours.`,
    html: `
      <div style="margin:0; padding:0; background:#f8fafc; font-family: Inter, Arial, sans-serif; color:#0f172a;">
        <div style="max-width:640px; margin:0 auto; padding:32px 16px;">
          <div style="background:linear-gradient(135deg,#0f172a 0%,#1d4ed8 100%); border-radius:24px; padding:28px; color:#fff; overflow:hidden; position:relative;">
            <div style="position:absolute; inset:auto -120px -120px auto; width:240px; height:240px; background:rgba(255,255,255,0.14); border-radius:999px; filter:blur(10px);"></div>
            <div style="position:relative; z-index:1;">
              <p style="margin:0 0 12px; font-size:12px; font-weight:800; letter-spacing:.18em; text-transform:uppercase; opacity:.85;">ProFacture Verification</p>
              <h1 style="margin:0 0 12px; font-size:30px; line-height:1.1; font-weight:900;">Confirm your email address</h1>
              <p style="margin:0; font-size:15px; line-height:1.7; max-width:520px; color:rgba(255,255,255,.88);">Hello ${name || ''}, use the 6-digit code below to activate your account. This code expires in 24 hours.</p>
            </div>
          </div>

          <div style="margin-top:18px; background:#ffffff; border:1px solid #e2e8f0; border-radius:24px; padding:28px; box-shadow:0 20px 50px rgba(15,23,42,.08);">
            <p style="margin:0 0 12px; font-size:13px; font-weight:800; letter-spacing:.14em; text-transform:uppercase; color:#64748b;">Verification code</p>
            <div style="display:flex; justify-content:center; margin:22px 0 24px;">
              <div style="display:inline-flex; gap:12px; padding:18px 22px; background:#f1f5f9; border:1px solid #dbeafe; border-radius:18px; font-size:34px; font-weight:900; letter-spacing:.35em; color:#0f172a;">
                <span>${displayCode}</span>
              </div>
            </div>
            <div style="display:grid; gap:12px;">
              <div style="padding:14px 16px; border-radius:16px; background:#eff6ff; color:#1d4ed8; font-size:14px; line-height:1.6; font-weight:700;">
                1. Open the verification screen in the app.
              </div>
              <div style="padding:14px 16px; border-radius:16px; background:#f8fafc; color:#334155; font-size:14px; line-height:1.6; font-weight:600; border:1px solid #e2e8f0;">
                2. Enter the 6-digit code exactly as shown above.
              </div>
              <div style="padding:14px 16px; border-radius:16px; background:#ecfdf5; color:#047857; font-size:14px; line-height:1.6; font-weight:700;">
                3. After verification, you can sign in and continue.
              </div>
            </div>
            <p style="margin:22px 0 0; font-size:12px; color:#64748b; line-height:1.6;">If you did not create this account, you can ignore this email.</p>
          </div>
        </div>
      </div>
    `,
  });
};