const { getProjectsFromInteraction } = require("../../utils/project");
const { getTasksFromInteraction } = require("../../utils/task");

/**
 *
 * @param {import("discord.js").Interaction} interaction
 * @param {import("discord.js").Client} client
 */

module.exports = async (interaction, client) => {
  if (!interaction.isAutocomplete()) return;
  if (
    !["task", "member", "project", "settings", "meeting", "workspace"].includes(
      interaction.commandName
    )
  )
    return;

  const focusedOption = interaction.options.getFocused(true);

  switch (focusedOption.name) {
    case "project":
      await autoCompleteProject(focusedOption, interaction);
      break;

    case "task":
      await autoCompleteTask(focusedOption, interaction);
      break;
  }
};

// Function autocomplete project names
async function autoCompleteProject(focusedOption, interaction) {
  const projects = await getProjectsFromInteraction(interaction);

  const filteredChoices = projects.filter((project) =>
    project.name.toLowerCase().startsWith(focusedOption.value.toLowerCase())
  );

  const results = filteredChoices.map((project) => ({
    name: project.name,
    value: project._id.toString(),
  }));

  interaction.respond(results.slice(0, 25)).catch(() => {});
}

// Function autocomplete task names
async function autoCompleteTask(focusedOption, interaction) {
  const tasks = await getTasksFromInteraction(interaction);

  const filteredTasks = tasks.filter((task) =>
    task.title.toLowerCase().startsWith(focusedOption.value.toLowerCase())
  );

  const taskResults = filteredTasks.map((task) => ({
    name: task.title,
    value: task._id.toString(),
  }));

  interaction.respond(taskResults.slice(0, 25)).catch(() => {});
}
