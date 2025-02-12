const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ComponentType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  UserSelectMenuBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require("discord.js");
const { getProjectsFromInteraction } = require("../../utils/project");
const {
  ButtonsConfirmCreate,
  ButtonsConfirmDelete,
} = require("../../components/buttons/ButtonConfirm");
const Task = require("../../models/Task");
const MenuProject = require("../../components/menuSelect/MenuProject");
const MenuTask = require("../../components/menuSelect/MenuTask");
const {
  invalidMembersAssignToTask,
  invalidMembersRemoveFromTask,
} = require("../../utils/member");
const { convertToUTC } = require("../../utils/convertTime");
const { ListPriority, ListStatus } = require("../../components/list/ListData");
const { getTasksFromInteraction } = require("../../utils/task");
const EmbedTaskInfo = require("../../components/embeds/EmbedTaskInfo");
const EmbedConfirm = require("../../components/embeds/EmbedConfirm");
const Project = require("../../models/Project");

// Data for the command
const data = new SlashCommandBuilder()
  .setName("task")
  .setDescription("Task configuration in project!")

  // Create task command
  .addSubcommand((subcommand) =>
    subcommand
      .setName("create")
      .setDescription("Create a task")
      .addStringOption((option) =>
        option
          .setName("project")
          .setDescription("The project you want to create a task")
          .setRequired(true)
          .setAutocomplete(true)
      )
  )

  // Setup task commands group
  .addSubcommandGroup((subcommandGroup) =>
    subcommandGroup
      .setName("set")
      .setDescription("Set the task's properties")

      // Set assignee for task command
      .addSubcommand((subcommand) =>
        subcommand
          .setName("assignee")
          .setDescription("Set the assignee of a task")
      )

      // Set due date for task command
      .addSubcommand((subcommand) =>
        subcommand
          .setName("due-date")
          .setDescription("Set the due date of a task.")
      )

      // Set priority for task command
      .addSubcommand((subcommand) =>
        subcommand
          .setName("priority")
          .setDescription("Set the priority of a task.")
      )

      // Set status for task command
      .addSubcommand((subcommand) =>
        subcommand.setName("status").setDescription("Set the status of a task.")
      )
  )

  //View task commands group
  .addSubcommandGroup((subcommandGroup) =>
    subcommandGroup
      .setName("view")
      .setDescription("View a task")

      // View a task command
      .addSubcommand((subcommand) =>
        subcommand
          .setName("one")
          .setDescription("View a task")
          .addStringOption((option) =>
            option
              .setName("task")
              .setDescription("The task you want to view")
              .setRequired(true)
              .setAutocomplete(true)
          )
      )

      // View all tasks in a project command
      .addSubcommand((subcommand) =>
        subcommand
          .setName("all")
          .setDescription("View all tasks in a project")
          .addStringOption((option) =>
            option
              .setName("project")
              .setDescription("The project you want to view all tasks")
              .setRequired(true)
              .setAutocomplete(true)
          )
      )
  )

  // Remove command group
  .addSubcommandGroup((subcommandGroup) =>
    subcommandGroup
      .setName("remove")
      .setDescription("Remove the task's properties")

      // Remove assignee for task command
      .addSubcommand((subcommand) =>
        subcommand
          .setName("assignee")
          .setDescription("Remove the assignee of a task")
      )

      // Remove due date for task command
      .addSubcommand((subcommand) =>
        subcommand
          .setName("due-date")
          .setDescription("Remove the due date of a task.")
      )
  )

  // Delete task command
  .addSubcommand((subcommand) =>
    subcommand.setName("delete").setDescription("Delete a task")
  );
// Function run when the command is called
/**
 *
 * @param {Object} param0
 * @param {ChatInputCommandInteraction} param0.interaction
 * @param {Client} param0.client
 */
async function run({ interaction, client, handler }) {
  if (!interaction.inGuild()) {
    interaction.reply({
      content: "This command is only available in guilds!",
    });
    return;
  }

  const subcommandGroup = interaction.options.getSubcommandGroup();
  const subcommand = interaction.options.getSubcommand();

  if (subcommandGroup) {
    switch (subcommandGroup) {
      // Run the set commands
      case "set":
        switch (subcommand) {
          // Run the set assignee command
          case "assignee":
            await handleSetAssignee(interaction);
            break;

          // Run the set due date command
          case "due-date":
            await handleSetDueDate(interaction);
            break;

          // Run the set priority command
          case "priority":
            await handleSetPriority(interaction);
            break;

          // Run the set status command
          case "status":
            await handleSetStatus(interaction);
            break;
        }
        break;

      //Run the remove commands
      case "remove":
        switch (subcommand) {
          // Run the remove assignee command
          case "assignee":
            await handleRemoveAssignee(interaction);
            break;

          // Run the remove due date command
          case "due-date":
            await handleRemoveDueDate(interaction);
            break;
        }
        break;

      // Run the view task commands
      case "view":
        switch (subcommand) {
          // Run the view task command
          case "one":
            await handleViewTask(interaction);
            break;

          // Run the view all tasks in a project command
          case "all":
            await handleViewAllTask(interaction);
            break;
        }
    }
  } else {
    switch (subcommand) {
      // Run the create task command
      case "create":
        await handleCreateTask(interaction);
        break;
        await handleViewTask(interaction);
        break;

      // Run the delete task command
      case "delete":
        await handleDeleteTask(interaction);
        break;
    }
  }
}

module.exports = {
  data,

  run,

  options: {
    // Option for delete command
    // deleted: true,
  },
};

// Function to handle create task
async function handleCreateTask(interaction) {
  const targetProjectId = interaction.options.getString("project");

  const projects = await getProjectsFromInteraction(interaction);

  const project = projects.find(
    (project) => project._id.toString() === targetProjectId
  );

  if (!project) {
    return interaction.reply({
      content: "Project not found!",
      ephemeral: true,
    });
  }

  const embed = new EmbedBuilder()
    .setTitle("Create a task")
    .setDescription(`Creating a task for project **${project.name}**`)
    .setFooter({ text: "You have 30 seconds to confirm this action." });

  const buttonsConfirm = ButtonsConfirmCreate;

  const actionRow = new ActionRowBuilder().addComponents(buttonsConfirm);

  await interaction.deferReply();

  const reply = await interaction.editReply({
    embeds: [embed],
    components: [actionRow],
  });

  const collector = reply.createMessageComponentCollector({
    conponentType: ComponentType.Button,
    filter: (i) => i.user.id === interaction.user.id,
    time: 60_000,
  });

  collector.on("collect", async (i) => {
    switch (i.customId) {
      case "create":
        const modal = new ModalBuilder()
          .setTitle("Create a task")
          .setCustomId(`create-task-${i.user.id}`);

        const titleInput = new TextInputBuilder()
          .setCustomId("task-title")
          .setLabel("Task Title")
          .setPlaceholder("Enter the task title")
          .setRequired(true)
          .setStyle(TextInputStyle.Short)
          .setMaxLength(100)
          .setMinLength(1);

        const descriptionInput = new TextInputBuilder()
          .setCustomId("task-description")
          .setLabel("Task Description")
          .setPlaceholder("Enter the task description")
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(1000);

        const firstActionRow = new ActionRowBuilder().addComponents(titleInput);
        const secondActionRow = new ActionRowBuilder().addComponents(
          descriptionInput
        );

        modal.addComponents(firstActionRow, secondActionRow);

        await i.showModal(modal);

        const filter = (i) => i.customId === `create-task-${i.user.id}`;

        i.awaitModalSubmit({ filter, time: 60_000 })
          .then(async (modalInteraction) => {
            const title =
              modalInteraction.fields.getTextInputValue("task-title");
            const description =
              modalInteraction.fields.getTextInputValue("task-description");

            if (!title || !description) {
              return modalInteraction.reply({
                content: "You need to fill all the fields",
              });
            }

            await modalInteraction.deferReply();

            await modalInteraction.editReply({
              content: "Creating task...",
            });

            // Create the task
            const newTask = new Task({
              projectId: project._id.toString(),
              title,
              description,
            });
            await newTask.save();

            const embed = new EmbedBuilder()
              .setTitle("Task Created")
              .setDescription(`Task **${title}** created successfully!`)
              .setColor("Green");

            await modalInteraction.editReply({
              embeds: [embed],
            });
          })
          .catch((err) => {
            console.log("Error at create task command:", err);
          });

        break;

      case "cancel":
        break;
    }
  });
}

// Function to handle task setting
async function handleTaskSetting(interaction, options) {
  const {
    title,
    description,
    menuBuilder,
    onTaskSelected,
    onMenuSelected,
    updateDescription,
    footerText = "You have 30 seconds to choosing.",
  } = options;

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor("Random")
    .setFooter({ text: footerText });

  const projects = await getProjectsFromInteraction(interaction);

  const menuProjects = MenuProject(projects);

  const actionRowProject = new ActionRowBuilder().addComponents(menuProjects);

  await interaction.deferReply();

  const replyPickProject = await interaction.editReply({
    embeds: [embed],
    components: [actionRowProject],
  });

  const collectorProject = replyPickProject.createMessageComponentCollector({
    componentType: ComponentType.StringSelect,
    filter: (i) => i.user.id === interaction.user.id,
    time: 60_000,
  });

  collectorProject.on("collect", async (i) => {
    const selectedProject = projects.find(
      (project) => project._id.toString() === i.values[0]
    );

    embed.setDescription(
      `Please choose the task you want to ${title.toLowerCase()} for in project **${
        selectedProject.name
      }**.`
    );

    const tasks = await Task.find({
      projectId: i.values[0],
    });

    if (tasks.length === 0) {
      await i.reply({
        content: "There are no tasks in this project!",
      });
      return;
    }

    const menuTasks = MenuTask(tasks);

    const actionRowTask = new ActionRowBuilder().addComponents(menuTasks);

    await i.deferReply();

    const replyPickTask = await i.editReply({
      embeds: [embed],
      components: [actionRowTask],
    });

    const collectorTask = replyPickTask.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      filter: (i) => i.user.id === interaction.user.id,
      time: 60_000,
    });

    collectorTask.on("collect", async (i) => {
      const task = tasks.find((task) => task._id.toString() === i.values[0]);

      if (updateDescription) {
        embed.setDescription(updateDescription(task, selectedProject));
      }

      if (onTaskSelected) {
        await onTaskSelected(i, task, selectedProject);
      }

      if (menuBuilder) {
        const menu = menuBuilder(task, selectedProject);
        const actionRowMenu = new ActionRowBuilder().addComponents(menu);

        await i.deferReply();

        const replyPickMenu = await i.editReply({
          embeds: [embed],
          components: [actionRowMenu],
        });

        const collectorMenu = replyPickMenu.createMessageComponentCollector({
          componentType: menu.data.type,
          filter: (i) => i.user.id === interaction.user.id,
          time: 60_000,
        });

        collectorMenu.on("collect", async (i) => {
          if (onMenuSelected) {
            await onMenuSelected(i, task, selectedProject);
          }
        });
      }
    });
  });
}

// Function to handle set assignee for task
async function handleSetAssignee(interaction) {
  await handleTaskSetting(interaction, {
    title: "Set Assignee for Task",
    description: "Please choose the project you want to set the assignee for.",
    updateDescription: (task, selectedProject) =>
      `Please select the users you want to set as assignee for task **${task.title}** in project **${selectedProject.name}**.`,
    menuBuilder: (task, selectedProject) => {
      const memberAmountInProject = selectedProject.members.length + 1;

      return new UserSelectMenuBuilder()
        .setCustomId("members")
        .setPlaceholder("Select members to add to the project")
        .setMinValues(1)
        .setMaxValues(memberAmountInProject);
    },
    onMenuSelected: async (i, task, selectedProject) => {
      const members = i.values;

      if (members.length === 0) {
        await i.reply({
          content: "You need to select at least one member!",
        });
        return;
      }

      const invalidMembers = await invalidMembersAssignToTask(
        members,
        task,
        interaction
      );

      if (invalidMembers.length > 0) {
        await i.reply({
          content: `Invalid members: ${invalidMembers.join(", ")}`,
        });
        return;
      }

      members.forEach((memberId) => {
        task.assigneesId.push(memberId);
      });

      await task.save();

      await i.deferReply();

      await i.editReply({
        content: "Assignees added successfully!",
        embeds: [],
        components: [],
      });
    },
  });
}

// Function to handle set due date for task
async function handleSetDueDate(interaction) {
  await handleTaskSetting(interaction, {
    title: "Set Due Date for Task",
    description: "Please choose the project you want to set the due date for.",
    onTaskSelected: async (i, task, selectedProject) => {
      const modal = new ModalBuilder()
        .setTitle("Set Due Date for Task")
        .setCustomId(`set-due-date-${i.user.id}`);

      const dueDateInput = new TextInputBuilder()
        .setLabel("Due Date")
        .setCustomId("due-date")
        .setPlaceholder("Enter the due date for the task. Format: YYYY-MM-DD")
        .setRequired(true)
        .setStyle(TextInputStyle.Short);

      const timeInput = new TextInputBuilder()
        .setLabel("Time")
        .setCustomId("time")
        .setPlaceholder("Enter the time for the task.")
        .setStyle(TextInputStyle.Short);

      const dateActionRow = new ActionRowBuilder().addComponents(dueDateInput);
      const timeActionRow = new ActionRowBuilder().addComponents(timeInput);

      modal.addComponents(dateActionRow, timeActionRow);

      await i.showModal(modal);

      const filter = (i) => i.customId === `set-due-date-${i.user.id}`;

      await i
        .awaitModalSubmit({ filter, time: 60_000 })
        .then(async (modalInteraction) => {
          const dueDateString =
            modalInteraction.fields.getTextInputValue("due-date");

          const timeString = modalInteraction.fields.getTextInputValue("time");

          if (!dueDateString) {
            return modalInteraction.reply({
              content: "You need to fill the due date field!",
            });
          }

          await modalInteraction.deferReply();

          await modalInteraction.editReply({
            content: "Setting due date...",
          });

          const dueDate = new Date(
            `${dueDateString}T${timeString}:00.000+00:00`
          );

          task.dueDate = dueDate;

          await task.save();

          const embed = new EmbedBuilder()
            .setTitle("Due Date Set")
            .setDescription(
              `Due date for task **${task.title}** set successfully!`
            )
            .setColor("Green")
            .addFields({
              name: "Due Date",
              value: convertToUTC(task.dueDate),
            });

          await modalInteraction.editReply({
            embeds: [embed],
          });
        });
    },
  });
}

// Function to handle set priority for task
async function handleSetPriority(interaction) {
  await handleTaskSetting(interaction, {
    title: "Set Priority for Task",
    description: "Please choose the project you want to set the priority for.",
    updateDescription: (task, selectedProject) =>
      `Please select the priority for task **${task.title}** in project **${selectedProject.name}**.`,
    menuBuilder: () => {
      const listPriority = ListPriority;

      return new StringSelectMenuBuilder()
        .setCustomId("priority")
        .setPlaceholder("Select the priority for the task")
        .setMinValues(1)
        .setMaxValues(1)
        .addOptions(
          listPriority.map((priority) =>
            new StringSelectMenuOptionBuilder()
              .setLabel(priority.name)
              .setDescription(priority.description)
              .setValue(priority.value)
              .setEmoji(priority.emoji)
          )
        );
    },
    onMenuSelected: async (i, task, selectedProject) => {
      const userInteractId = i.user.id;

      if (
        !task.assigneesId.includes(userInteractId) &&
        selectedProject.ownerId !== userInteractId
      ) {
        await i.reply({
          content:
            "You are not an assignee of this task or project's owner! You can't set the priority.",
        });
        return;
      }

      const priority = i.values[0];

      task.priority = priority;

      await task.save();

      await i.deferReply();

      await i.editReply({
        content: "Priority set successfully!",
        embeds: [],
        components: [],
      });
    },
  });
}

// Function to handle set status for task
async function handleSetStatus(interaction) {
  await handleTaskSetting(interaction, {
    title: "Set Status for Task",
    description: "Please choose the project you want to set the status for.",
    updateDescription: (task, selectedProject) =>
      `Please select the status for task **${task.title}** in project **${selectedProject.name}**.`,
    menuBuilder: () => {
      const listStatus = ListStatus;

      return new StringSelectMenuBuilder()
        .setCustomId("status")
        .setPlaceholder("Select the status for the task")
        .setMinValues(1)
        .setMaxValues(1)
        .addOptions(
          listStatus.map((status) =>
            new StringSelectMenuOptionBuilder()
              .setLabel(status.name)
              .setDescription(status.description)
              .setValue(status.value)
              .setEmoji(status.emoji)
          )
        );
    },
    onMenuSelected: async (i, task, selectedProject) => {
      const userInteractId = i.user.id;

      if (
        !task.assigneesId.includes(userInteractId) &&
        selectedProject.ownerId !== userInteractId
      ) {
        await i.reply({
          content:
            "You are not an assignee of this task or project's owner! You can't set the status.",
        });
        return;
      }

      const status = i.values[0];

      task.status = status;

      await task.save();

      await i.deferReply();

      await i.editReply({
        content: "Status set successfully!",
        embeds: [],
        components: [],
      });
    },
  });
}

// Function to handle view task
async function handleViewTask(interaction) {
  const taskId = interaction.options.getString("task");

  const tasks = await getTasksFromInteraction(interaction);

  const task = tasks.find((task) => task._id.toString() === taskId);

  await interaction.deferReply();

  if (!task) {
    await interaction.editReply({
      content: `Task doesn't exist! Please use command \`/task create\` to create the task.`,
    });
    return;
  }

  const embed = EmbedTaskInfo(task, interaction);

  await interaction.editReply({
    embeds: [embed],
  });
}

// Function to handle view all tasks in a project
async function handleViewAllTask(interaction) {
  const projectId = interaction.options.getString("project");

  if (!projectId) {
    await interaction.reply({
      content: "Please choose a project!",
    });
    return;
  }

  const project = await Project.findOne({
    _id: projectId,
  });

  const tasks = await Task.find({
    projectId: projectId,
  });

  if (tasks.length === 0) {
    await interaction.reply({
      content:
        "There are no tasks in this project! Please create one by using `/task create`",
    });
    return;
  }

  const taskFields = [];

  tasks.forEach((task) => {
    taskFields.push({
      name: "Task",
      value: task.title,
      inline: true,
    });

    taskFields.push({
      name: "Status",
      value: task.status,
      inline: true,
    });

    taskFields.push({
      name: "Priority",
      value: task.priority,
      inline: true,
    });

    taskFields.push({
      name: "Due Date",
      value: convertToUTC(task.dueDate) || "No due date provided",
      inline: true,
    });

    taskFields.push({
      name: "===========================",
      value: " ",
      inline: false,
    });
  });

  const embed = new EmbedBuilder()
    .setTitle(`Tasks in project **${project.name}**`)
    .setDescription("Here are the tasks in this project:")
    .setColor("Random")
    .addFields(taskFields);

  const menuTasks = MenuTask(tasks);

  const actionRow = new ActionRowBuilder().addComponents(menuTasks);

  await interaction.deferReply();

  const reply = await interaction.editReply({
    embeds: [embed],
    components: [actionRow],
  });

  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.StringSelect,
    filter: (i) => i.user.id === interaction.user.id,
    time: 60_000,
  });

  collector.on("collect", async (i) => {
    const task = tasks.find((task) => task._id.toString() === i.values[0]);

    const embed = EmbedTaskInfo(task, interaction);

    await i.deferReply();

    await i.editReply({
      embeds: [embed],
    });
  });
}

//Function to handle remove assignee for task
async function handleRemoveAssignee(interaction) {
  await handleTaskSetting(interaction, {
    title: "Remove Assignee for Task",
    description:
      "Please choose the project you want to remove the assignee for.",
    updateDescription: (task, selectedProject) =>
      `Please select the users you want to remove as assignee for task **${
        task.title
      }** in project **${
        selectedProject.name
      }**. \n Members already assigned: ${task.assigneesId
        .map((id) => `<@${id}>`)
        .join(", ")}`,
    menuBuilder: (task) => {
      const assignees = task.assigneesId;

      return new UserSelectMenuBuilder()
        .setCustomId("members")
        .setPlaceholder("Select members to remove from the task")
        .setMinValues(1)
        .setMaxValues(assignees.length);
    },

    onTaskSelected: async (i, task, selectedProject) => {
      if (task.assigneesId.length === 0) {
        await i.reply({
          content: "There are no assignees in this task!",
        });
        return;
      }
    },

    onMenuSelected: async (i, task, selectedProject) => {
      const members = i.values;

      if (members.length === 0) {
        await i.reply({
          content: "You need to select at least one member!",
        });
        return;
      }

      const invalidMembers = await invalidMembersRemoveFromTask(
        members,
        task,
        interaction
      );

      if (invalidMembers.length > 0) {
        await i.reply({
          content: `Invalid members: ${invalidMembers.join(", ")}`,
        });
        return;
      }

      const memberMentions = members
        .map((memberId) => `<@${memberId}>`)
        .join(", ");

      const embedConfirm = EmbedConfirm(
        "Remove Assignees",
        `Are you sure you want to remove the assignees: ${memberMentions} from the task **${task.title}**?`,
        "You have 60 seconds to confirm this action."
      );

      const buttonsConfirm = ButtonsConfirmDelete;

      const actionRow = new ActionRowBuilder().addComponents(buttonsConfirm);

      await i.deferReply();

      const reply = await i.editReply({
        embeds: [embedConfirm],
        components: [actionRow],
      });

      const collector = reply.createMessageComponentCollector({
        componentType: ComponentType.Button,
        filter: (i) => i.user.id === interaction.user.id,
        time: 60_000,
      });

      collector.on("collect", async (i) => {
        switch (i.customId) {
          case "confirm":
            members.forEach((memberId) => {
              task.assigneesId = task.assigneesId.filter(
                (assignee) => assignee !== memberId
              );
            });

            await task.save();

            await i.deferReply();

            await i.editReply({
              content: "Assignees removed successfully!",
              embeds: [],
              components: [],
            });
            break;

          case "cancel":
            await i.deferReply();

            await i.editReply({
              content: "Action remove assignee canceled!",
              embeds: [],
              components: [],
            });
            break;
        }
      });
    },
  });
}

//Function to handle remove due date for task
async function handleRemoveDueDate(interaction) {
  await handleTaskSetting(interaction, {
    title: "Remove Due Date for Task",
    description:
      "Please choose the project you want to remove the due date for.",
    onTaskSelected: async (i, task, selectedProject) => {
      const embedConfirm = EmbedConfirm(
        "Remove Due Date",
        `Are you sure you want to remove the due date: **${convertToUTC(
          task.dueDate
        )}** for the task **${task.title}**?`,
        "You have 60 seconds to confirm this action."
      );

      const buttonsConfirm = ButtonsConfirmDelete;

      const actionRow = new ActionRowBuilder().addComponents(buttonsConfirm);

      await i.deferReply();

      const reply = await i.editReply({
        embeds: [embedConfirm],
        components: [actionRow],
      });

      const collector = reply.createMessageComponentCollector({
        componentType: ComponentType.Button,
        filter: (i) => i.user.id === interaction.user.id,
        time: 60_000,
      });

      collector.on("collect", async (i) => {
        switch (i.customId) {
          case "confirm":
            task.dueDate = null;

            await task.save();

            await i.deferReply();

            await i.editReply({
              content: "Due date removed successfully!",
              embeds: [],
              components: [],
            });
            break;

          case "cancel":
            await i.deferReply();

            await i.editReply({
              content: "Action remove due date canceled!",
              embeds: [],
              components: [],
            });
            break;
        }
      });
    },
  });
}

//Function to handle delete task
async function handleDeleteTask(interaction) {
  await handleTaskSetting(interaction, {
    title: "Delete Task",
    description: "Please choose the project you want to delete the task for.",
    onTaskSelected: async (i, task, selectedProject) => {
      if (selectedProject.ownerId !== i.user.id) {
        await i.reply({
          content:
            "You are not the owner of this project! You can't delete the task.",
        });
        return;
      }

      const embedConfirm = EmbedConfirm(
        "Delete Task",
        `Are you sure you want to delete the task **${task.title}**?`,
        "You have 60 seconds to confirm this action."
      );

      const buttonsConfirm = ButtonsConfirmDelete;

      const actionRow = new ActionRowBuilder().addComponents(buttonsConfirm);

      await i.deferReply();

      const reply = await i.editReply({
        embeds: [embedConfirm],
        components: [actionRow],
      });

      const collector = reply.createMessageComponentCollector({
        componentType: ComponentType.Button,
        filter: (i) => i.user.id === interaction.user.id,
        time: 60_000,
      });

      collector.on("collect", async (i) => {
        switch (i.customId) {
          case "confirm":
            await Task.findByIdAndDelete(task._id);

            await i.deferReply();

            await i.editReply({
              content: "Task deleted successfully!",
              embeds: [],
              components: [],
            });
            break;

          case "cancel":
            await i.deferReply();

            await i.editReply({
              content: "Action delete task canceled!",
              embeds: [],
              components: [],
            });
            break;
        }
      });
    },
  });
}
