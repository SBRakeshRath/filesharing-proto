import { Socket } from "socket.io";

export default function fileChunkReceive(
  socket: Socket,
  roomID: string,
  chunk: any
) {
  // send the chunk to the room

  console.log("chunk received by server");

  socket.to(roomID).emit("file-chunk-received", chunk);
}
