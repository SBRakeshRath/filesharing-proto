import "./App.css";
import { socket } from "./core/socket";
import { useEffect, useMemo, useState } from "react";
export default function App() {
  const connect = () => {
    socket.connect();
  };

  const [isConnected, setIsConnected] = useState(socket.connected);
  const [roomID, setRoomID] = useState("");
  const [userList, setUserList] = useState<string[]>([]);

  const [chats, setChats] = useState<string[]>([]);
  const [socketId, setSocketId] = useState("");
  const [start, setStart] = useState(0);
  const [fileInfo, setFileInfo] = useState({ totalChunks: 0, name: "" });

  const [receivedIndexArray, setReceivedIndexArray] = useState<number[]>([]);

  interface FileChunk {
    index: number;
    chunk: Blob;
    start: number;
    end: number;
  }

  const [fileChunks, setFileChunks] = useState<(FileChunk | null)[]>([]);

  const createRoom = () => {
    socket.emit("create-room");
  };

  const chatSend = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const chat = e.currentTarget.querySelector("input")?.value;
    console.log(roomID);
    socket.emit("send-chat", { chat, roomID });
  };

  const joinRoom = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const roomId = e.currentTarget.querySelector("input")?.value;
    socket.emit("join-room", roomId);
  };

  const chunkify = useMemo(() => {
    return (file: File) => {
      const chunkSize = 1000000;
      const chunks = [];
      const totalChunks = Math.ceil(file.size / chunkSize);

      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(file.size, start + chunkSize);
        const chunk = file.slice(start, end);
        chunks.push({
          index: i,
          chunk,
          start: start,
          end: end,
        });
      }

      return { chunks, totalChunks };
    };
  }, []);
  const fileSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const file = e.currentTarget.querySelector("input")?.files?.[0];

    if (!file) {
      return;
    }

    const { totalChunks } = chunkify(file);
    setReceivedIndexArray([]);

    socket.emit("send-file-info", { totalChunks, roomID,name:file.name });

    // reset the fileChunks


  };

  useEffect(() => {
    if (fileChunks.length === 0) {
      return;
    }

    console.log(fileChunks);
  }, [fileChunks]);

  useEffect(() => {
    socket.on("connect", () => {
      setIsConnected(true);
      setSocketId(socket.id ? socket.id : "");
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("room-created", (roomId) => {
      setRoomID(roomId);
    });

    socket.on("room-joined", (roomId) => {
      setRoomID(roomId);
    });

    socket.on("user-joined", (userId) => {
      setUserList((prev) => [...prev, userId]);
    });

    socket.on("chat-received", (chat) => {
      setChats((prev) => [...prev, chat]);
    });

    socket.on("file-info-sent", () => {
      console.log("file info sent");
      setStart(1);
    });

    socket.on("receive-file-info", (fileInfo) => {
      const { totalChunks,name } = fileInfo;

      console.log("file info received", fileInfo);
      setReceivedIndexArray([]);
      setFileInfo({ totalChunks, name });

      setFileChunks(new Array(totalChunks).fill(null).map(() => null));
    });

    socket.on("file-chunk-received", (chunk) => {
      const { index } = chunk;
      console.log("chunk received", chunk);
      console.log("chunk received", index);

      setReceivedIndexArray((prev) => [...prev, index]);

      setFileChunks((prev) => {
        const newChunks = [...prev];
        newChunks[index] = chunk;
        return newChunks;
      });
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("room-created");
      socket.off("user-joined");
      socket.off("chat-received");
      socket.off("receive-file-info");
      socket.off("file-info-sent");
      socket.off("file-chunk-received");
    };
  });

  useEffect(() => {
    console.log("start", start);
    if (start === 1) {
      const file = (document.getElementById("file") as HTMLInputElement)
        ?.files?.[0];
      console.log("file", file);
      if (!file) {
        return;
      }
      const { chunks } = chunkify(file);
      chunks.forEach((chunk, index) => {
        socket.emit("send-file-chunk", { chunk, roomID, index });
      });

      // reset everything

      setStart(0);


    }

    
  }, [start, fileChunks, roomID, chunkify]);

  useEffect(() => {
    console.log("receivedIndexArray", receivedIndexArray, fileChunks.length);
    if (
      receivedIndexArray.length !== fileChunks.length ||
      fileChunks.length === 0 ||
      receivedIndexArray.length === 0
    ) {
      return;
    }

    // all chunks received and fileChunks is complete

    const file = fileChunks.reduce((acc, chunk) => {
      if (!chunk) {
        return acc;
      }
      return new Blob([acc, chunk.chunk]);
    }, new Blob([]));

    const url = URL.createObjectURL(file);

    //download the file

    const link = document.createElement("a");
    link.href = url;
    link.download = fileInfo.name;

    

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setFileChunks([]);

    setReceivedIndexArray([]);

    setStart(0);

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("room-created");
      socket.off("user-joined");
      socket.off("chat-received");
      socket.off("receive-file-info");
      socket.off("file-info-sent");
      socket.off("file-chunk-received");


    }
  }, [fileChunks, fileInfo.name, receivedIndexArray]);

  return (
    <div className="appClass">
      <h1>File Sharing app</h1>
      <div className="option">
        <p>create room or connect a room</p>
        <button onClick={connect}>Connect</button>
        <button>Disconnect</button>

        <div>
          <h2>Connection Status</h2>
          <p>{isConnected ? "Connected" : "Disconnected"}</p>
          <p>Socket ID: {socketId}</p>
        </div>

        <div>
          <h2>Room</h2>
          <form onSubmit={joinRoom}>
            <input type="text" placeholder="Enter room id" />
            <button>Join</button>
          </form>
          <button onClick={createRoom}>Create</button>
          <br />
          <p className="roomId">{roomID}</p>

          <h2>Users</h2>
          <ul>
            {userList.map((user) => (
              <li key={user}>{user}</li>
            ))}
          </ul>

          <h2>Chats</h2>

          <div className="chats">
            {chats.map((chat, index) => (
              <p key={index}>{chat}</p>
            ))}

            <form onSubmit={chatSend} className="sendChat">
              <input type="text" />
              <button type="submit">Send</button>
            </form>
          </div>

          <h2>File</h2>
          <form onSubmit={fileSend}>
            <input type="file" id="file" />
            <button type="submit">Send</button>
          </form>
          <div className="progressPercentage">
           {
              receivedIndexArray.length === fileChunks.length ? "100%" : `${(receivedIndexArray.length / fileChunks.length) * 100}%`
           }
          </div>
        </div>
      </div>
    </div>
  );
}
