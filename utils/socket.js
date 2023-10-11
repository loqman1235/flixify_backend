import { Server } from "socket.io";

// Export a function to create and configure the Socket.IO instance
export const createSocketIOInstance = (httpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: "http://localhost:5173" },
  });

  io.on("connection", (socket) => {
    console.log("A user connected");

    socket.on("disconnect", () => {
      console.log("A user disconnected");
    });

    // Handle custom events from the client
    socket.on("createMovie", (newMovie) => {
      console.log("Received new movie:", newMovie);

      // Broadcast the new movie to all connected clients
      io.emit("newMovieNotification", newMovie);
    });
  });

  return io; // Return the Socket.IO instance
};
