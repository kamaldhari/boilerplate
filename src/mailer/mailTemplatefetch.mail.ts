import { messageTemplatesModel } from "../models/emailTemplate.model";
import { userModel } from "../models/user.model";

export const mailTemplatefetchEmail = async (
  data: {
    _id?: number;
    hospitalId?: string;
    patientId?: string;
    userDataId?: string;
    schedule?: string;
    status?: string;
    emailId?: string;
    patientNot?: boolean;
  },
  senderEmail: string,
  trigger: string,
  link: string = "",
) => {
  try {
    const template = await messageTemplatesModel
      .findOne({ _id: trigger })
      .lean();
    if (template && template.isActive === true) {
      const finalTemplate = {
        body: template?.body || {},
        subject: template?.subject || "",
        name: template.templateName,
        _id: template._id,
      };
      const userData = await userModel
        .findById(data._id)
        .select("firstName lastName emailId");

      if (userData?.emailId) {
        let updates: any = {};

        updates = {
          firstName: `${userData?.firstName}`,
          lastName: `${userData?.lastName}`,
          senderUser: "BolierPlate",
          link,
        };

        if (typeof finalTemplate.body === "string") {
          const EmailBody = finalTemplate.body.replace(
            /\$\{(\w+)\}/g,
            (match, key) => updates[key],
          );
          const subject = finalTemplate.subject.replace(
            /\$\{(\w+)\}/g,
            (match, key) => updates[key],
          );
          let mailOptions: any = {};

          mailOptions = {
            from: senderEmail,
            to: userData.emailId,
            subject,
            html: EmailBody,
            replyTo: senderEmail,
          };
          return mailOptions;
        } else {
          return false;
        }
      }
      return false;
    }
    return false;
  } catch (error) {
    return error;
  }
};
