import express from "express";
import upload from "../middlewares/multer.js";
import verifyToken from "../middlewares/verifyToken.js";

import {
  addMovieDislike,
  addMovieLike,
  createMovie,
  deleteMovieById,
  getAllMovies,
  getMovieById,
  updateMovieById,
} from "../controllers/moviesController.js";
import verifyUserToken from "../middlewares/verifyUserToken.js";

const router = express.Router();
router.get("/", getAllMovies);
router.get("/:id", getMovieById);
router.post(
  "/",
  upload.fields([{ name: "poster" }, { name: "backdrop" }]),
  verifyToken,
  (req, res) => {
    const io = req.app.get("io");
    createMovie(req, res, io);
  }
);
router.put(
  "/:id",
  upload.fields([{ name: "poster" }, { name: "backdrop" }]),
  verifyToken,
  updateMovieById
);
router.delete("/:id", verifyToken, deleteMovieById);

// Managing likes/dislikes
router.post("/:id/like", verifyUserToken, addMovieLike);
router.post("/:id/dislike", verifyUserToken, addMovieDislike);

export default router;
