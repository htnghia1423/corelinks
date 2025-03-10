const { Schema, model } = require("mongoose");

const meetingSchema = new Schema(
  {
    guildId: {
      type: String,
      required: true,
    },
    projectId: {
      type: String,
      required: true,
    },
    channelId: {
      type: String,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    time: {
      type: Date,
      required: true,
    },
    attendees: {
      type: [String],
    },
    createdBy: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = model("Meeting", meetingSchema);
