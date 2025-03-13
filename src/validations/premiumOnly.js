const User = require("../models/User");

module.exports = async ({ interaction, commandObj, handler }) => {
  if (commandObj.options.premiumOnly) {
    const user = await User.findOne({ userId: interaction.user.id });

    if (!user || user.userType !== "premium") {
      await interaction.reply({
        content: "You need to be a premium user to use this command",
        ephemeral: true,
      });
      return false;
    }
    return true;
  }
};
