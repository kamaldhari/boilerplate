/* eslint-disable no-shadow */
/* eslint-disable no-return-assign */
/* eslint-disable no-param-reassign */
/* eslint-disable global-require */
// =================================================================================================
import { Server } from "socket.io";
import { userModel } from "../../models/user.model";

let io;

/**
 * Creating Socket IO server and assigning filtered rooms to the incoming connections.
 * @param {object} server
 */
export const createSocketIOServer = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
    },
  });
  io.on("connection", async (socket) => {
    const token = socket.handshake.headers.authorization;

    if (token) {
      const filter = {
        "tokens.token": token,
      };
      const user: any = await userModel.findOne(filter).lean();
      if (user) {
        const rooms = [];
        socket.join(rooms);
      } else {
        socket.disconnect();
      }
    } else {
      socket.disconnect();
    }
  });
};

/**
 * Main emittor for socket connections.
 * @param {string} operation
 * @param {string} key
 * @param {object} data
 */
export const callSocket = (operation, key, data) => {
  const room = `${operation}-${key}`;
  io?.to(room).emit(operation.trim(), data);
};
