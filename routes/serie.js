import express from "express";
import upload from "../middlewares/multer.js";
import verifyToken from "../middlewares/verifyToken.js";
import {
  addSerieDislike,
  addSerieLike,
  createEpisode,
  createSeason,
  createSerie,
  getAllSeries,
  getEpisodeBySlug,
  getEpisodesBySlugs,
  getSeasonBySerieSlug,
  getSeasonsBySerieSlug,
  getSerieBySlug,
  removeEpisodeBySlug,
  removeSeasonBySlugs,
  removeSerieBySlug,
  updateEpisodeBySlug,
  updateSeasonBySlugs,
  updateSerieBySlug,
} from "../controllers/seriesController.js";
import verifyUserToken from "../middlewares/verifyUserToken.js";

const router = express.Router();
router.get("/", getAllSeries);
router.get("/:serieSlug", getSerieBySlug);
router.post(
  "/",
  verifyToken,
  upload.fields([{ name: "poster" }, { name: "backdrop" }]),
  createSerie
);
router.put(
  "/:serieSlug",
  verifyToken,
  upload.fields([{ name: "poster" }, { name: "backdrop" }]),
  updateSerieBySlug
);
router.delete("/:serieSlug", verifyToken, removeSerieBySlug);

// Seasons
router.post("/:serieSlug/seasons", verifyToken, createSeason);
router.get("/:serieSlug/seasons", getSeasonsBySerieSlug);
router.get("/:serieSlug/seasons/:seasonSlug", getSeasonBySerieSlug);
router.put("/:serieSlug/seasons/:seasonSlug", verifyToken, updateSeasonBySlugs);
router.delete(
  "/:serieSlug/seasons/:seasonSlug",
  verifyToken,
  removeSeasonBySlugs
);

// Episodes
router.post(
  "/:serieSlug/seasons/:seasonSlug/episodes",
  verifyToken,
  createEpisode
);
router.get("/:serieSlug/seasons/:seasonSlug/episodes", getEpisodesBySlugs);
router.get(
  "/:serieSlug/seasons/:seasonSlug/episodes/:episodeSlug",
  getEpisodeBySlug
);
router.put(
  "/:serieSlug/seasons/:seasonSlug/episodes/:episodeSlug",
  verifyToken,
  updateEpisodeBySlug
);
router.delete(
  "/:serieSlug/seasons/:seasonSlug/episodes/:episodeSlug",
  verifyToken,
  removeEpisodeBySlug
);

// Manage Likes/Dislikes
router.post("/:serieSlug/like", verifyUserToken, addSerieLike);
router.post("/:serieSlug/dislike", verifyUserToken, addSerieDislike);

export default router;
