const loginOtpEmailBody = ({ name, otp, purpose = "login" }) => {
  const actionText =
    purpose === "signup"
      ? "Use the OTP below to complete your Elecmoon signup"
      : "Use the OTP below to sign in to your Elecmoon account";

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Elecmoon Login OTP</title>
  </head>
  <body style="margin:0;padding:0;background:#f2f3f8;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f2f3f8;padding:40px 16px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(11,29,61,0.08);">
            <tr>
              <td style="background:#0b1d3d;padding:28px 32px;text-align:center;">
                <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">Elecmoon</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 12px;color:#0b1d3d;font-size:16px;">Hi ${name || "there"},</p>
                <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.6;">
                  ${actionText}. This code expires in <strong>10 minutes</strong>.
                </p>
                <div style="text-align:center;margin:28px 0;">
                  <span style="display:inline-block;background:#ED1C24;color:#ffffff;font-size:32px;font-weight:700;letter-spacing:8px;padding:16px 28px;border-radius:8px;">
                    ${otp}
                  </span>
                </div>
                <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
                  If you did not request this code, you can safely ignore this email.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background:#f9fafb;text-align:center;color:#9ca3af;font-size:12px;">
                &copy; Elecmoon &mdash; Badarpur, New Delhi 110044
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};

module.exports = { loginOtpEmailBody };
