const {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  Client,
  ActionRowBuilder,
  ComponentType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const { getProjectsFromInteraction } = require("../../utils/project");
const { EmbedBuilder } = require("@discordjs/builders");
const {
  ButtonsConfirmCreate,
} = require("../../components/buttons/ButtonConfirm");
const { isValidDate, isValidTime } = require("../../utils/checkFormat");
const Meeting = require("../../models/Meeting");
const { convertToPlus7 } = require("../../utils/convertTime");
const { formatDateTime } = require("../../utils/format");
const checkAndCreateUser = require("../../utils/checkAndCreateUser");

//Data for the command
const data = new SlashCommandBuilder()
  .setName("meeting")
  .setDescription("Meeting configuration!")
  .addSubcommand((subcommand) =>
    subcommand
      .setName("create")
      .setDescription("Create a meeting!")
      .addStringOption((option) =>
        option
          .setName("project")
          .setDescription("The project you want to create a meeting for")
          .setRequired(true)
          .setAutocomplete(true)
      )
      .addChannelOption((option) =>
        option
          .setName("channel")
          .setDescription("The channel to send the meeting notification to")
          .setRequired(true)
      )
  );

//Function run when the command is called
/**
 *
 * @param {Object} param0
 * @param {ChatInputCommandInteraction} param0.interaction
 * @param {Client} param0.client
 */
async function run({ interaction, client, handler }) {
  const subcommand = interaction.options.getSubcommand();

  await checkAndCreateUser(interaction);

  switch (subcommand) {
    //Create meeting command
    case "create":
      await handleCreateMeeting(interaction);
      break;
  }
}

module.exports = {
  //Data for the command
  data,

  //Function run when the command is called
  run,

  options: {
    //Options for the delete command
    // deleted: true,
    premiumOnly: true,
  },
};

// Function to handle the create meeting command
async function handleCreateMeeting(interaction) {
  const targetProjectId = interaction.options.getString("project");
  const tagerChannel = interaction.options.getChannel("channel");

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
    .setTitle("Create a meeting!")
    .setDescription(`Create a meeting for the project **${project.name}**`)
    .setFooter({
      text: "You have 30 seconds to confirm this action",
    });

  const buttonsConfirm = ButtonsConfirmCreate;

  const actionRow = new ActionRowBuilder().addComponents(buttonsConfirm);

  await interaction.deferReply();

  const reply = await interaction.editReply({
    embeds: [embed],
    components: [actionRow],
  });

  const collector = reply.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter: (i) => i.user.id === interaction.user.id,
    time: 30_000,
  });

  collector.on("collect", async (i) => {
    switch (i.customId) {
      case "create":
        const modal = new ModalBuilder()
          .setTitle("Create a meeting!")
          .setCustomId(`create-meeting-${i.user.id}`);

        const titleInput = new TextInputBuilder()
          .setCustomId("meeting-title")
          .setLabel("Meeting Title")
          .setPlaceholder("Enter the title of the meeting")
          .setRequired(true)
          .setStyle(TextInputStyle.Short)
          .setMinLength(3)
          .setMaxLength(100);

        const descriptionInput = new TextInputBuilder()
          .setCustomId("meeting-description")
          .setLabel("Meeting Description")
          .setPlaceholder("Enter the description of the meeting")
          .setRequired(false)
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(1000);

        const dateInput = new TextInputBuilder()
          .setCustomId("meeting-date")
          .setLabel("Meeting Date")
          .setPlaceholder("Enter the date of the meeting. Format: YYYY-MM-DD")
          .setRequired(true)
          .setStyle(TextInputStyle.Short);

        const timeInput = new TextInputBuilder()
          .setCustomId("meeting-time")
          .setLabel("Meeting Time")
          .setPlaceholder("Enter the time of the meeting. Format: HH:MM")
          .setRequired(true)
          .setStyle(TextInputStyle.Short);

        const durationInput = new TextInputBuilder()
          .setCustomId("meeting-duration")
          .setLabel("Meeting Duration")
          .setPlaceholder("Enter the duration of the meeting in minutes")
          .setRequired(true)
          .setStyle(TextInputStyle.Short);

        const firstActionRow = new ActionRowBuilder().addComponents(titleInput);
        const secondActionRow = new ActionRowBuilder().addComponents(
          descriptionInput
        );
        const thirdActionRow = new ActionRowBuilder().addComponents(dateInput);
        const fourthActionRow = new ActionRowBuilder().addComponents(timeInput);
        const fifthActionRow = new ActionRowBuilder().addComponents(
          durationInput
        );

        modal.addComponents(
          firstActionRow,
          secondActionRow,
          thirdActionRow,
          fourthActionRow,
          fifthActionRow
        );

        await i.showModal(modal);

        const filter = (i) => i.customId === `create-meeting-${i.user.id}`;

        await i
          .awaitModalSubmit({ filter, time: 1000 * 60 * 5 })
          .then(async (modalInteraction) => {
            const title =
              modalInteraction.fields.getTextInputValue("meeting-title");
            const description = modalInteraction.fields.getTextInputValue(
              "meeting-description"
            );
            const date =
              modalInteraction.fields.getTextInputValue("meeting-date");
            const time =
              modalInteraction.fields.getTextInputValue("meeting-time");
            const duration = parseInt(
              modalInteraction.fields.getTextInputValue("meeting-duration"),
              10
            );

            if (!isValidDate(date)) {
              return modalInteraction.reply({
                content: "Invalid date format. Please use YYYY-MM-DD",
                ephemeral: true,
              });
            }

            if (!isValidTime(time)) {
              return modalInteraction.reply({
                content: "Invalid time format. Please use HH:MM",
                ephemeral: true,
              });
            }

            await modalInteraction.deferReply();

            await modalInteraction.editReply({
              content: "Creating the meeting...",
            });

            const fullTime = new Date(`${date}T${time}:00.000+00:00`);
            const endTime = new Date(fullTime.getTime() + duration * 60 * 1000);

            const overlappingMeetings = await Meeting.find({
              projectId: targetProjectId,
              time: { $lt: endTime },
              $expr: { $gt: [{ $add: ["$time", "$duration"] }, fullTime] },
            });

            if (overlappingMeetings.length > 0) {
              return modalInteraction.editReply({
                content:
                  "There is already a meeting scheduled during this time.",
                ephemeral: true,
              });
            }

            const newMeeting = new Meeting({
              guildId: modalInteraction.guild.id,
              projectId: targetProjectId,
              channelId: tagerChannel.id,
              title,
              description,
              time: fullTime,
              createdBy: modalInteraction.user.id,
              duration: duration * 60 * 1000,
            });

            await newMeeting.save();

            const embed = new EmbedBuilder()
              .setTitle("Meeting Created!")
              .setDescription(
                `The meeting **${title}** has been created for the project **${
                  project.name
                }** at ${formatDateTime(fullTime)}`
              );

            await modalInteraction.editReply({
              embeds: [embed],
            });
          })
          .catch((err) => {
            console.log("Error in meeting creation", err);
          });

        break;

      case "cancel":
        i.reply({
          content: "Meeting creation cancelled!",
          ephemeral: true,
          components: [],
          embeds: [],
        });
        break;
    }
  });
}
