import { CONFIG } from "config";

const setresetPasswordUrl = `${CONFIG.frontendConfig.baseUrl}${CONFIG.frontendConfig.resetPasswordSlug}`;

export const userForgotPasswordMail = (user, senderEmail) => {
  try {
    const mailOptions = {
      from: senderEmail,
      to: user.emailId,
      subject: "Boilderplate : Reset password",
      html: `<table style="border-collapse: separate; border-spacing: 0 2em">
      <tr>
        <td>
          <center><h2>Password Reset</h2></center>
        </td>
      </tr>
      <tr>
        <td>
          <p>
            Hello <b>Dr. ${user?.firstName} ${user?.lastName},</b>
          </p>
        </td>
      </tr>
      <tr>
        <td>
          <p>
              Seems like you forgot your password for Doccine. If this is true, click below to reset your password.
          </p>
          <p>
          <a href="${setresetPasswordUrl}${user.resetPassword.key}" target="_blank"><b>Verify Your Account</b></a>
      </p>
        </td>
      </tr>
      <tr>
        <td>
          <p>
            <b>
              Stay secure,<br />
              The Boilder Team
            </b>
          </p>

          <p></p>
        </td>
      </tr>
    </table>`,
    };
    return mailOptions;
  } catch (error) {
    return error;
  }
};
