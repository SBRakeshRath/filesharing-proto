// socket io server

import { Server } from "socket.io";
import { createServer } from "http";
import { config } from "dotenv";
import { createRoom } from "../events/createRoom.js";
import JoinRoom from "../events/joinRoom.js";
import fileChunkReceive from "../events/fileChunkReceive.js";
config();

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("a user connected with id: " + socket.id);
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });

  socket.on("create-room", () => {
    createRoom(socket);
  });
  socket.on("join-room", (roomId) => {
    JoinRoom(socket, roomId);
  });
  socket.on("send-file-info", ({ totalChunks, roomID, name }) => {
    //send the file info to the room

    socket.to(roomID).emit("receive-file-info", { totalChunks,name });

    // tell the sender that the file info has been received
    socket.emit("file-info-sent", true);
  });

  socket.on("send-file-chunk", ({ chunk, roomID }) => {
    fileChunkReceive(socket, roomID, chunk);
  });

  socket.on("send-chat", ({ chat, roomID }) => {
    //send the chat to the room

    socket.to(roomID).emit("chat-received", chat);

    console.log(
      "chat sent to room - " + roomID + " - chat - " + chat + " - by - " + socket.id
    );
  });
});

httpServer.listen(process.env.PORT || 3000, () => {
  console.log("listening on *:3000");
});
