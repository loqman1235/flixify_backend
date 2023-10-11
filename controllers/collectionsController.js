import Collection from "../models/Collection.js";
import Movie from "../models/Movie.js";
import Serie from "../models/Serie.js";
import { validationResult } from "express-validator";
import collectionValidationRules from "../validators/collectionValidator.js";

export const createCollection = async (req, res) => {
  try {
    const { name, contentItems } = req.body;

    await Promise.all(collectionValidationRules.map((rule) => rule.run(req)));
    const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
      return res.status(400).json({ errors: validationErrors.array() });
    }

    const collection = new Collection({ name, items: contentItems });
    const savedCollection = await collection.save();
    res.status(201).json(savedCollection);
  } catch (error) {
    console.error("Error creating collection:", error);
    res.status(500).json({ message: "Error creating collection" });
  }
};

export const getCollectionById = async (req, res) => {
  try {
    const { collectionId } = req.params;
    const collection = await Collection.findById(collectionId);

    if (!collection) {
      return res.status(404).json("Collection not found");
    }

    // Extract contentIds and contentTypes from collection items
    const contentIds = collection.items.map((item) => item.contentId);
    const contentTypes = collection.items.map((item) => item.contentType);

    // Fetch content details based on contentIds and contentTypes
    const contentItems = await Promise.all(
      contentIds.map(async (contentId, index) => {
        const contentType = contentTypes[index];
        const contentModel = contentType === "Movie" ? Movie : Serie;
        const content = await contentModel.findById(contentId);
        return content;
      })
    );

    // Combine content details with contentTypes and send response
    const populatedCollection = {
      name: collection.name,
      items: contentItems.map((contentItem, index) => ({
        content: contentItem,
        contentType: contentTypes[index],
      })),
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
      _id: collection._id,
    };

    res.status(200).json({ collection: populatedCollection });
  } catch (error) {
    console.error("Error fetching collection:", error);
    res.status(500).json({ message: "Error fetching collection" });
  }
};

export const getAllCollections = async (req, res) => {
  try {
    const collections = await Collection.find();

    if (collections.length === 0) {
      return res.status(404).json("Collections not found");
    }

    const populatedCollections = await Promise.all(
      collections.map(async (collection) => {
        const contentIds = collection.items.map((item) => item.contentId);
        const contentTypes = collection.items.map((item) => item.contentType);

        const contentItems = await Promise.all(
          contentIds.map(async (contentId, index) => {
            const contentType = contentTypes[index];
            const contentModel = contentType === "Movie" ? Movie : Serie;
            const content = await contentModel.findById(contentId);
            return content;
          })
        );

        const populatedCollection = {
          name: collection.name,
          items: contentItems.map((contentItem, index) => ({
            content: contentItem,
            contentType: contentTypes[index],
          })),
          createdAt: collection.createdAt,
          updatedAt: collection.updatedAt,
          _id: collection._id,
        };

        return populatedCollection;
      })
    );

    res.status(200).json({ collections: populatedCollections });
  } catch (error) {
    console.error("Error fetching collections:", error);
    res.status(500).json({ message: "Error fetching collections" });
  }
};

export const updateCollection = async (req, res) => {
  try {
    const { collectionId } = req.params;
    const { name, contentIds } = req.body;

    // Validation
    await Promise.all(collectionValidationRules.map((rule) => rule.run(req)));
    const validationErrors = validationResult(req);

    if (!validationErrors.isEmpty()) {
      return res.status(400).json({ errors: validationErrors.array() });
    }

    const updatedCollection = await Collection.findByIdAndUpdate(
      collectionId,
      { name, items: contentIds },
      { new: true }
    );

    if (!updatedCollection) {
      return res.status(404).json({ message: "Collection not found" });
    }

    res.status(200).json(updatedCollection);
  } catch (error) {
    console.error("Error updating collection:", error);
    res.status(500).json({ message: "Error updating collection" });
  }
};

export const removeCollection = async (req, res) => {
  try {
    const { collectionId } = req.params;

    const removedCollection = await Collection.findByIdAndRemove(collectionId);

    if (!removedCollection) {
      return res.status(404).json({ message: "Collection not found" });
    }

    res.status(200).json({ message: "Collection removed successfully" });
  } catch (error) {
    console.error("Error removing collection:", error);
    res.status(500).json({ message: "Error removing collection" });
  }
};
