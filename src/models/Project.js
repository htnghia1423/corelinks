const { Schema, model } = require("mongoose");

const ProjectSchema = new Schema(
  {
    guildId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    ownerId: {
      type: String,
      required: true,
    },
    members: {
      type: [String],
    },
  },
  { timestamps: true }
);

module.exports = model("Project", ProjectSchema);
