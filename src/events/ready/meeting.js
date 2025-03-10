const { Client } = require("discord.js");
const Meeting = require("../../models/Meeting");
const Project = require("../../models/Project");
const { formatDateTime } = require("../../utils/format");

/**
 *
 * @param {Client} client
 */
module.exports = (client) => {
  checkAndCreateMeeting();
  setInterval(checkAndCreateMeeting, 1 * 60 * 60 * 1000);

  async function checkAndCreateMeeting() {
    try {
      const meetings = await Meeting.find();

      for (const meeting of meetings) {
        const targetGuild =
          client.guilds.cache.get(meeting.guildId) ||
          (await client.guilds.fetch(meeting.guildId));

        if (!targetGuild) {
          await Meeting.findByIdAndDelete({
            _id: meeting._id,
          });
          continue;
        }

        const targetChannel = targetGuild.channels.cache.get(meeting.channelId);
        if (!targetChannel) continue;

        const project = await Project.findById(meeting.projectId);
        if (!project) continue;

        const roleId = project.roleId;
        const currentTime = new Date();
        const meetingTime = new Date(meeting.time);
        const timeDifference = meetingTime - currentTime;

        if (timeDifference > 0 && timeDifference <= 30 * 60 * 1000) {
          const formattedTime = formatDateTime(meetingTime);
          const message = `<@&${roleId}>, the meeting **${meeting.title}** for the project **${project.name}** is scheduled to start at ${formattedTime}.`;

          await targetChannel.send(message);
        }
      }
    } catch (error) {
      console.error("Error checking and creating meetings:", error);
    }
  }
};
