import express from "express";
import mongoose from "mongoose";
import config from "config";
import cors from "cors";
import routerPhoto from "./routes/photos.routes.js";
import routerAuth from "./routes/auth.routes.js";
import routerTest from "./routes/test.routes.js";
import Sex from "./models/Sex.js";
import routerRegister from "./routes/register.routes.js";
import City from "./models/City.js";
import path from "path";
import { fileURLToPath } from "url";
import User from "./models/User.js";
const { ObjectId } = mongoose.Types;
import axios from "axios";
import { count, log } from "console";
import fs from "fs";
import routerLikes from "./routes/likes.routes.js";
import Likes from "./models/Likes.js";
import routerChats from "./routes/chats.routes.js";
import Rooms from "./models/Rooms.js";
import http from "http";
import { Server } from "socket.io";
import Messages from "./models/Messages.js";
import routerToken from "./routes/token.routes.js";
import { fakerRU as faker } from "@faker-js/faker";
import { cities } from "./constants/cities.js";
import { Random } from "random-js";
const random = new Random(); // uses the nativeMath engine

const app = express();
const server = http.createServer(app);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Папка, где хранятся загруженные файлы
const uploadDir = path.join(__dirname, "uploads");

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  // подключение к комнате
  socket.on("joinRoom", (room) => {
    socket.join(room);
  });

  socket.on("message", ({ room, message, user, timestamp, isRead }) => {
    io.to(room).emit("message", { room, message, user, timestamp, isRead });
  });

  socket.on("markRead", ({ user, room }) => {
    io.to(room).emit("markRead", { user });
  });
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use("/api", routerPhoto);
app.use("/api", routerAuth);
app.use("/api", routerTest);
app.use("/api", routerRegister);
app.use("/api", routerLikes);
app.use("/api", routerChats);
app.use("/api", routerToken);
app.use("/api/upload", express.static(uploadDir));

const PORT = config.get("PORT") || 3000;

async function start() {
  try {
    await mongoose.connect(config.get("Uri")).then(() => {
      console.log("Connected to MongoDB");
    });

    server.listen(PORT, () => {
      console.log(`Server started on ${PORT} port`);
    });
  } catch (e) {
    console.log("server fail: ", e.message);
    process.exit(1);
  }
}

start();
