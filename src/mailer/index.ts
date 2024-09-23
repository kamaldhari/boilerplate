import { CONFIG } from "../config";
import * as nodemailer from "nodemailer";
import { mailTemplatefetchEmail } from "./mailTemplatefetch.mail";

const senderEmail = CONFIG.emailConfig.senderID;
const { senderPassword } = CONFIG.emailConfig;
const setPasswordBaseUrl = `${CONFIG.frontendConfig.baseUrl}${CONFIG.frontendConfig.setPasswordSlug}`;
const setresetPasswordUrl = `${CONFIG.frontendConfig.baseUrl}${CONFIG.frontendConfig.resetPasswordSlug}`;

interface TransportDetails {
  auth: {
    user: string;
    pass: string;
  };
  host?: string;
  port?: number;
  secure?: boolean;
  service?: string;
}

const transportDetails: TransportDetails = {
  auth: {
    user: senderEmail,
    pass: senderPassword,
  },
};

if (CONFIG.emailConfig.host) transportDetails.host = CONFIG.emailConfig.host;
if (CONFIG.emailConfig.port) {
  transportDetails.port = CONFIG.emailConfig.port;
  transportDetails.secure = true;
}
if (CONFIG.emailConfig.service)
  transportDetails.service = CONFIG.emailConfig.service;

const transporter = nodemailer.createTransport(transportDetails);

const dispatch = async (mailOptions) => {
  transporter.sendMail(mailOptions, (res) => {
    console.log(res);
  });
};

export const sendEmail = {
  userForgotPassword: async (user, trigger) => {
    const link = `${setresetPasswordUrl}${user.resetPassword.key}`;
    try {
      const mailOptions = await mailTemplatefetchEmail(
        user,
        senderEmail,
        trigger,
        link,
      );
      console.log(mailOptions);
      dispatch(mailOptions);
    } catch (error) {
      return error;
    }
  },
  userApproved: async (user, trigger) => {
    try {
      const link = `${setPasswordBaseUrl}${user.metadata.key}`;
      const mailOptions = await mailTemplatefetchEmail(
        user,
        senderEmail,
        trigger,
        link,
      );
      dispatch(mailOptions);
    } catch (error) {
      return error;
    }
  },
  userRejected: async (user, trigger) => {
    try {
      const mailOptions = await mailTemplatefetchEmail(
        user,
        senderEmail,
        trigger,
      );
      dispatch(mailOptions);
    } catch (error) {
      return error;
    }
  },
  userVerificationEmail: async (user, trigger: string) => {
    try {
      const link = `${setPasswordBaseUrl}${user.metadata.key}`;
      const mailOptions = await mailTemplatefetchEmail(
        user,
        senderEmail,
        trigger,
        link,
      );
      dispatch(mailOptions);
    } catch (error) {
      return error;
    }
  },
};
