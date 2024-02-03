import express from "express";
import mongoose from "mongoose";
import stripe from "stripe";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import movie from "./routes/movie.js";
import genre from "./routes/genre.js";
import admin from "./routes/admin.js";
import serie from "./routes/serie.js";
import plan from "./routes/plan.js";
import payment from "./routes/payment.js";
import subscription from "./routes/subscription.js";
import user from "./routes/user.js";
import collection from "./routes/collection.js";

dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_URL },
});
// Middlware
app.use("/api/v1/payments/webhook", express.raw({ type: "*/*" }));
app.use(express.json());
app.use(cors({ credentials: true, origin: process.env.FRONTEND_URL }));
app.use(cookieParser());
app.use(express.static("public"));

// Pass the 'io' instance to the 'req' object
app.set('io', io)

const dbConnection = mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");

    let port = process.env.SERVER_PORT || 3003;
    httpServer.listen(port, () =>
      console.log(`Server started at port ${port}`)
    );
    // Routes
    app.use("/api/v1/movies", movie);
    app.use("/api/v1/series", serie);
    app.use("/api/v1/genres", genre);
    app.use("/api/v1/collections", collection);
    app.use("/api/v1/plans", plan);
    app.use("/api/v1/payments", payment);
    app.use("/api/v1/subscriptions", subscription);
    app.use("/api/v1/users", user);
    app.use("/api/v1/admin", admin);
  })
  .catch((err) => console.error("Error connecting to MongoDB", err));
