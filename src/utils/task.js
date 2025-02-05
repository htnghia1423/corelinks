const Project = require("../models/Project");
const Task = require("../models/Task");
const { convertToUTC } = require("./convertTime");

function durationToDeadline(task) {
  return convertToUTC(task.dueDate) - Date.now();
}

async function getTasksFromInteraction(interaction) {
  const projects = await Project.find({
    guildId: interaction.guildId,
    $or: [{ ownerId: interaction.user.id }, { members: interaction.user.id }],
  });

  const tasks = [];

  for (const project of projects) {
    const projectTasks = await Task.find({
      projectId: project._id.toString(),
    });

    tasks.push(...projectTasks);
  }

  return tasks;
}

module.exports = {
  durationToDeadline,
  getTasksFromInteraction,
};
