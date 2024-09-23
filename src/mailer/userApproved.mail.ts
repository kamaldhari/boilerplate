import { CONFIG } from "../config";

const setPasswordBaseUrl = `${CONFIG.frontendConfig.baseUrl}${CONFIG.frontendConfig.setPasswordSlug}`;

export const userApprovedMail = (user, senderEmail, senderUser) => {
  try {
    const mailOptions = {
      from: senderEmail,
      to: user.emailId,
      subject: "Congratulations! Your user account has been approved.",
      html: `

<table style="border-collapse: separate; border-spacing: 0 2em;">
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
            This is to inform you that your pending user account has been approved.
            Please click on the link below to continue with further process.
        </p>
        <p>
            <a href="${setPasswordBaseUrl}${user.metadata.key}" target="_blank">${setPasswordBaseUrl}${user.metadata.key}</a>
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
</table>

`,
    };
    return mailOptions;
  } catch (error) {
    return error;
  }
};
