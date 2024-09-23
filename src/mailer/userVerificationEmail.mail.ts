import { CONFIG } from "../config";

const setPasswordBaseUrl = `${CONFIG.frontendConfig.baseUrl}${CONFIG.frontendConfig.setPasswordSlug}`;
export const userVerificationfetchEmail = (user, senderEmail, senderUser) => {
  try {
    const mailOptions = {
      from: senderEmail,
      to: user.emailId,
      subject: "Boilerplate : Email Verification",
      html: `<table style="border-collapse: separate; border-spacing: 0 2em;">
            <tr>
                <td>
                    <center><h2>Email Verification</h2></center>
                </td>
            </tr>
            <tr>
                <td>
                    <p>
                        <b>Greetings ${user.firstName},</b>
                    </p>
                </td>
            </tr>
            <tr>
                <td>
                    <p>
                    Your emailid for Doccine has been changed as per your request. If this is true, click below to verify your account by resetting password. 
                    </p>
                    <p>
                        <a href="${setPasswordBaseUrl}${user.metadata.key}" target="_blank"><b>Verify Your Account</b></a>
                    </p>
                </td>
            </tr>
            <tr>
                <td>
                    <p>
                        <b>
                        With Regards,<br>
                        ${senderUser}
                        </b>
                    <p>
                </td>
            </tr>
            </table>`,
    };
    return mailOptions;
  } catch (error) {
    return error;
  }
};
