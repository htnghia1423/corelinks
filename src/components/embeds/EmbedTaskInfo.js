const { EmbedBuilder } = require("discord.js");
const { convertToUTC, convertToPlus7 } = require("../../utils/convertTime");

module.exports = (task, interaction) => {
  return new EmbedBuilder()
    .setTitle("Task Information")
    .setColor("Random")
    .addFields([
      {
        name: "Title",
        value: task.title,
      },
      {
        name: "Description",
        value: task.description || "No description provided",
      },
      {
        name: "Priority",
        value: task.priority || "No priority provided",
      },
      {
        name: "Status",
        value: task.status,
      },
      {
        name: "Due Date",
        value: convertToUTC(task.dueDate) || "No due date provided",
      },
      {
        name: "Assignees",
        value:
          task.assigneesId.map((assigneeId) => `<@${assigneeId}>`).join("\n") ||
          "No assignees provided",
      },
      {
        name: "Created At",
        value: convertToPlus7(task.createdAt),
      },
      {
        name: "Updated At",
        value: convertToPlus7(task.updatedAt),
      },
    ])
    .setTimestamp(new Date());
};
