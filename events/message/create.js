const { Events, EmbedBuilder } = require('discord.js');  // Importer Events et EmbedBuilder
const { userLevels } = require('../../database.js'); // Importer la table userLevels
const logger = require('../../logger'); // Importer logger

/**
 * Capte l'envoi d'un message
 * @param {Message} message Le message envoyé
 * @returns
 */
module.exports = (client) => {
    client.on(Events.MessageCreate, async (message) => {
        logger.debug('-- MessageCreate --');
        logger.debug(message.author.username + ' dans ' + message.channel.name + ' : ' + message.content);
        const bumbChannelId = '993935433228619886'; // le channel du bump
        const commandName = 'bump'; // la commande de bump
        const bumpBotID = '302050872383242240'; // l'id du bot de bump

        if (!message.author.bot) {
            levelManager(message)
        }

        // Si le message n'est pas dans le channel de bump ou c'est mon bot qui a envoyé le message ou le message n'est pas envoyé par le bot de bump
        if (message.channelId !== bumbChannelId || message.author.id !== bumpBotID) return;

        // Si le message est envoyé par le bot de bump et que la commande est bump
        if (message.interaction.commandName === commandName) {
            // eslint-disable-next-line no-useless-escape
            const codeText = '\/Bump\'';
            message.channel.send('Merci d\'avoir bump le serveur <@' + message.interaction.user.id + '> !' + '\nNous vous rappelerons dans 2 heures de bump le serveur !');
            setTimeout(() => {
                message.channel.send('Il est temps de Bump ! <@&1044348995901861908> !');
                const embed = new EmbedBuilder()
                    .setColor('#EBBC4E')
                    .setTitle('Il est temps de Bump !')
                    .addFields({
                        name: ' ',
                        value: 'Utilisez la commande de ' + codeText + ' de <@302050872383242240>',
                    })
                    .setImage('https://images2.imgbox.com/05/c5/b2vOiqS4_o.gif');

                message.channel.send({ embeds: [embed] });
            }, 7200000);
        }
    });

    async function levelManager(message) {
        if (message.author.bot) return;
    
        const messageUserId = message.author.id;
    
        try {
            if (await userLevels.findOne({ where: { ul_user_id: messageUserId } }) !== null) {
                await userLevels.increment('ul_xp', { by: 1, where: { ul_user_id: messageUserId } });
            } else {
                await userLevels.create({ ul_name: message.author.username, ul_user_id: messageUserId, ul_level: 0, ul_xp: 1 });
            }
        } catch (error) {
            console.error(error);
        }
    }
};
