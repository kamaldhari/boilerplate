import * as csv from "csv-parser";
import { ObjectId } from "mongodb";
import { Readable } from "stream";
import logger from "utils/logger";
/**
 * Join Nested Iterations to String
 * @param {object} requestObj
 * @param {string} superKey
 * @param {object} processObj
 * @returns {object}
 * */
export const iterateObject = (requestObj, superKey = "", processObj = {}) => {
  Object.keys(requestObj).forEach((key) => {
    const sk = `${superKey}.${key}`;
    if (
      requestObj[key] !== null &&
      requestObj[key] !== undefined &&
      requestObj[key].constructor === Object
    ) {
      processObj = iterateObject(requestObj[key], sk, processObj);
    } else {
      processObj[`${sk.slice(1)}`] = requestObj[key];
    }
  });
  return processObj;
};

export const parsify = (obj) => JSON.parse(JSON.stringify(obj));
export function convertTZ(date, tzString) {
  return new Date(
    (typeof date === "string" ? new Date(date) : date).toLocaleString("en-US", {
      timeZone: tzString,
    }),
  );
}

/**
 * Generate password
 * @returns {string}
 */
export const generatePassword = () => {
  const chars =
    "0123456789abcdefghijklmnopqrstuvwxyz!@#$%^&*aABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const passwordLength = Math.round(Math.random() * 10 + 10);
  let password = "";
  for (let i = 0; i <= passwordLength; i += 1) {
    const randomNumber = Math.floor(Math.random() * chars.length);
    password += chars.substring(randomNumber, randomNumber + 1);
  }
  return password;
};

/**
 * convert text in days / weeks / months / years to calculated past date
 * @param {string} cdstr
 * @param {string} date
 * @returns {date}
 */
export const countDaysStringToDate = (cdstr, date) => {
  let cdcnt = cdstr.match(/\d/g);
  date = date ? new Date(date) : new Date();

  if (cdcnt !== null) cdcnt = parseInt(cdcnt.join(""), 10);

  if (cdcnt > 0) {
    if (/day/i.test(cdstr)) {
      date.setDate(date.getDate() - cdcnt);
    } else if (/week/i.test(cdstr)) {
      cdcnt *= 7;
      date.setDate(date.getDate() - cdcnt);
    } else if (/month/i.test(cdstr)) {
      date.setMonth(date.getMonth() - cdcnt);
    } else if (/year/i.test(cdstr)) {
      date.setFullYear(date.getFullYear() - cdcnt);
    }
  }

  return date;
};

/**
 * Subtracts dates and returns number of days / weeks / months / years as string
 * @param {string} fromDate
 * @param {string} toDate
 * @returns {string}
 */
export const dateToCountDaysString = (fromDate, toDate) => {
  fromDate = new Date(fromDate);
  toDate = toDate ? new Date(toDate) : new Date();

  const time = toDate.getTime() - fromDate.getTime();
  const days = Math.round(time / (3600000 * 24));

  if (days < 100) {
    // DAYS
    const count = days;
    return `${count} Day${count !== 1 ? "s" : ""}`;
  }
  if (days < 365) {
    // MONTHS
    const count = Math.round(days / 30);
    return `${count} Month${count !== 1 ? "s" : ""}`;
  }
  // YEARS
  const count = Math.round(days / 365);
  return `${count} Year${count !== 1 ? "s" : ""}`;
};

/**
 * Check if object id is valid
 * @param {string} id
 */
export const isValidObjectId = (id) => {
  return ObjectId.isValid(id);
};

export const convertToUTC = (date) => {
  const dateUTC = new Date(date);
  dateUTC.setUTCHours(0, 0, 0, 0);

  return dateUTC;
};

export const escape = async (text) => {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

/**
 *
 * @param buffer
 * @returns
 */
export const bufferToStream = (buffer: Buffer): Readable => {
  try {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
  } catch (error) {
    logger?.error("bufferToStream - Error: ", error);
  }
};

export const parseCSV = async (buffer: Buffer): Promise<any[]> => {
  try {
    return await new Promise((resolve, reject) => {
      const results = [];
      const stream = bufferToStream(buffer);
      stream
        .pipe(csv())
        .on("data", (data) => results.push(data))
        .on("end", () => resolve(results))
        .on("error", (error) => reject(error));
    });
  } catch (error) {
    logger?.error("parseCSV - Error: ", error);
  }
};
