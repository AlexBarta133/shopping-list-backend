const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  shoppingListId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ShoppingList",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    default: 1,
  },
  isChecked: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Item", itemSchema);