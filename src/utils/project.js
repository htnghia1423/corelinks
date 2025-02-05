const Project = require("../models/Project");

async function getProjectsFromInteraction(interaction) {
  const projects = await Project.find({
    guildId: interaction.guildId,
    ownerId: interaction.user.id,
  });

  return projects;
}

module.exports = {
  getProjectsFromInteraction,
};
