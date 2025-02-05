const { EmbedBuilder } = require("discord.js");
const { convertToPlus7 } = require("../../utils/convertTime");

const EmbedProjectInfo = (project, interaction) => {
  return new EmbedBuilder()
    .setTitle("Project Information")
    .setColor("Random")
    .addFields([
      {
        name: "Name",
        value: project.name,
      },
      {
        name: "Owner",
        value: `<@${project.ownerId}>`,
      },
      {
        name: "Members",
        value:
          project.members.map((memberId) => `<@${memberId}>`).join("\n") ||
          "No members",
      },
      {
        name: "Created At",
        value: convertToPlus7(project.createdAt),
      },
    ])
    .setTimestamp(new Date())
    .setThumbnail(interaction.user.displayAvatarURL());
};

module.exports = EmbedProjectInfo;
