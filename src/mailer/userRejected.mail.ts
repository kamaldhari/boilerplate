export const userRejectedMail = (user, senderEmail, senderUser) => {
  try {
    const mailOptions = {
      from: senderEmail,
      to: user.emailId,
      subject: "Sorry! Your user account has been rejected.",
      html: `

<table style="border-collapse: separate; border-spacing: 0 2em;">
<tr>
    <td>
        <p>
            <b>Hello ${user.firstName},</b>
        </p>
    </td>
</tr>
<tr>
    <td>
        <p>
            This is to inform you that your user account has not been approved by our administration team.<br>
            Please contact us for further assistance.
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
