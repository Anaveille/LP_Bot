const { Events } = require('discord.js');  // Importer Events et EmbedBuilder

/**
* Capte la modification des rôles d'un membre
* @param {GuildMember} oldMember Le membre avant la modification
* @param {GuildMember} newMember Le membre après la modification
* @returns
*/
module.exports = (client) => {
    client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
        if (!oldMember.roles.cache.has('965755928974618735') && newMember.roles.cache.has('965755928974618735')) {
            memberUpdate.boost(newMember);
        }
    });
};