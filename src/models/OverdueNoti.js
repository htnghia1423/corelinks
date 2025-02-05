const { Schema, model } = require("mongoose");

const OverdueNotiSchema = new Schema(
  {
    guildId: {
      type: String,
      required: true,
    },
    channelId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = model("OverdueNoti", OverdueNotiSchema);
