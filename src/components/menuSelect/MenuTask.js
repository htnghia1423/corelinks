const {
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require("discord.js");

module.exports = (tasks) => {
  return new StringSelectMenuBuilder()
    .setCustomId("task")
    .setPlaceholder("Select a task")
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(
      tasks.map((task) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(task.title)
          .setValue(task._id.toString())
      )
    );
};
