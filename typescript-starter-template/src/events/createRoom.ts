//create socket room

import { Socket } from "socket.io";
import { v4 as uuidv4 } from "uuid";

export const createRoom = async (socket: Socket) => {
  //create a random room id
  const roomId = uuidv4();

  //join the room

  await socket.join(roomId);

  //send the room id to the client

  socket.emit("room-created", roomId);
  console.log("room created" + roomId);
};
