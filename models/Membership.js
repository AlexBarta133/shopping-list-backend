const mongoose = require("mongoose");

const membershipSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  shoppingListId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ShoppingList",
    required: true,
  },
  role: {
    type: String,
    enum: ["owner", "member"],
    required: true,
  },
});

module.exports = mongoose.model("Membership", membershipSchema);