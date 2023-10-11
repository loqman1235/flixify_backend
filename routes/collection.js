import express from "express";
import {
  createCollection,
  getAllCollections,
  getCollectionById,
  removeCollection,
  updateCollection,
} from "../controllers/collectionsController.js";

const router = express.Router();

// Create a collection
router.post("/", createCollection);
router.get("/:collectionId", getCollectionById);
router.get("/", getAllCollections);
router.put("/:collectionId", updateCollection);
router.delete("/:collectionId", removeCollection);

export default router;
