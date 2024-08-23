import { Socket } from "socket.io";

export default function JoinRoom(Socket: Socket, roomId: string) {
  Socket.on("join-room", async (roomId) => {
    await Socket.join(roomId);

    //send the room id to the client

    Socket.emit("room-joined", roomId);

    Socket.to(roomId).emit("user-joined", Socket.id);

    console.log("room joined" + roomId + "by" + Socket.id);
  });
}
