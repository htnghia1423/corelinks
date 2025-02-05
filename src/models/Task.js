const { Schema, model } = require("mongoose");

const TaskSchema = new Schema(
  {
    projectId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    assigneesId: {
      type: [String],
    },
    dueDate: {
      type: Date,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
    },
    status: {
      type: String,
      enum: ["todo", "in-progress", "done"],
      default: "todo",
    },
    subTasksId: {
      type: [String],
    },
  },
  { timestamps: true }
);

module.exports = model("Task", TaskSchema);
