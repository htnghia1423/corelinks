const {
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require("discord.js");

module.exports = (projects) => {
  return new StringSelectMenuBuilder()
    .setCustomId("project")
    .setPlaceholder("Select a project to add member to")
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(
      projects.map((project) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(project.name)
          .setValue(project._id.toString())
      )
    );
};
