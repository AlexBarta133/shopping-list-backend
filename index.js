const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
console.log(process.env.MONGO_URI);
const ShoppingList = require("./models/ShoppingList");
const Membership = require("./models/Membership");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Shopping List API is running" });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(process.env.PORT, () => {
      console.log(`Server running on http://localhost:${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });
  app.post("/shoppingList/create", async (req, res) => {
  try {
    const { name, ownerId } = req.body;

    if (!name || !ownerId) {
      return res.status(400).json({
        error: "invalidDtoIn",
        message: "name and ownerId are required",
      });
    }

    const shoppingList = await ShoppingList.create({
      name,
      ownerId,
    });

    await Membership.create({
      userId: ownerId,
      shoppingListId: shoppingList._id,
      role: "owner",
    });

    res.status(201).json({
      message: "Shopping list created",
      shoppingList,
    });
  } catch (error) {
    res.status(500).json({
      error: "serverError",
      message: error.message,
    });
  }
});

app.get("/shoppingList/list", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        error: "invalidDtoIn",
        message: "userId is required",
      });
    }

    // najdi membershipy pro usera
    const memberships = await Membership.find({ userId });

    const shoppingListIds = memberships.map(m => m.shoppingListId);

    // najdi shopping listy podle ID
    const shoppingLists = await ShoppingList.find({
      _id: { $in: shoppingListIds },
    });

    res.json({
      shoppingLists,
    });
  } catch (error) {
    res.status(500).json({
      error: "serverError",
      message: error.message,
    });
  }
});

app.get("/shoppingList/get/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    if (!id || !userId) {
      return res.status(400).json({
        error: "invalidDtoIn",
        message: "id and userId are required",
      });
    }

    const shoppingList = await ShoppingList.findById(id);

    if (!shoppingList) {
      return res.status(404).json({
        error: "shoppingListDoesNotExist",
        message: "Shopping list does not exist",
      });
    }

    const membership = await Membership.findOne({
      userId,
      shoppingListId: id,
    });

    if (!membership) {
      return res.status(403).json({
        error: "userIsNotAuthorized",
        message: "User is not authorized to access this shopping list",
      });
    }

    res.json({
      shoppingList,
    });
  } catch (error) {
    res.status(500).json({
      error: "serverError",
      message: error.message,
    });
  }
});

app.post("/shoppingList/update", async (req, res) => {
  try {
    const { id, name, userId } = req.body;

    if (!id || !name || !userId) {
      return res.status(400).json({
        error: "invalidDtoIn",
        message: "id, name and userId are required",
      });
    }

    const shoppingList = await ShoppingList.findById(id);

    if (!shoppingList) {
      return res.status(404).json({
        error: "shoppingListDoesNotExist",
        message: "Shopping list does not exist",
      });
    }

    const membership = await Membership.findOne({
      userId,
      shoppingListId: id,
      role: "owner",
    });

    if (!membership) {
      return res.status(403).json({
        error: "userIsNotAuthorized",
        message: "Only owner can update this shopping list",
      });
    }

    shoppingList.name = name;
    await shoppingList.save();

    res.json({
      message: "Shopping list updated",
      shoppingList,
    });
  } catch (error) {
    res.status(500).json({
      error: "serverError",
      message: error.message,
    });
  }
});

app.post("/shoppingList/delete", async (req, res) => {
  try {
    const { id, userId } = req.body;

    if (!id || !userId) {
      return res.status(400).json({
        error: "invalidDtoIn",
        message: "id and userId are required",
      });
    }

    const shoppingList = await ShoppingList.findById(id);

    if (!shoppingList) {
      return res.status(404).json({
        error: "shoppingListDoesNotExist",
        message: "Shopping list does not exist",
      });
    }

    const membership = await Membership.findOne({
      userId,
      shoppingListId: id,
      role: "owner",
    });

    if (!membership) {
      return res.status(403).json({
        error: "userIsNotAuthorized",
        message: "Only owner can delete this shopping list",
      });
    }

    // smaž membershipy
    await Membership.deleteMany({ shoppingListId: id });

    // smaž items (kdybys je měl)
    // await Item.deleteMany({ shoppingListId: id });

    // smaž list
    await ShoppingList.findByIdAndDelete(id);

    res.json({
      message: "Shopping list deleted",
    });
  } catch (error) {
    res.status(500).json({
      error: "serverError",
      message: error.message,
    });
  }
});