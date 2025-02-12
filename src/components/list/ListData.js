const { ChannelType } = require("discord.js");

const ListPriority = [
  { name: "Low", value: "low", emoji: "🟢", description: "Low priority" },
  {
    name: "Medium",
    value: "medium",
    emoji: "🟡",
    description: "Medium priority",
  },
  { name: "High", value: "high", emoji: "🔴", description: "High priority" },
];

const ListStatus = [
  {
    name: "To Do",
    value: "todo",
    description: "Task to do",
    emoji: "🔵",
  },
  {
    name: "In Progress",
    value: "in-progress",
    description: "Task in progress",
    emoji: "🟡",
  },
  { name: "Done", value: "done", description: "Task done", emoji: "🟢" },
];

const ListChannelWrorkSpace = [
  {
    name: "notification",
    type: ChannelType.GuildText,
  },
  {
    name: "chat",
    type: ChannelType.GuildText,
  },
  {
    name: "reports",
    type: ChannelType.GuildText,
  },
  {
    name: "voice-meeting",
    type: ChannelType.GuildVoice,
  },
];

module.exports = {
  ListPriority,
  ListStatus,
  ListChannelWrorkSpace,
};
