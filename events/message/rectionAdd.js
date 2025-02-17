const { Events, EmbedBuilder } = require('discord.js'); // Importer Events
const { Tags } = require('../../database.js');
const logger = require('../../logger'); // Importer logger

module.exports = (client) => {
    client.on(Events.MessageReactionAdd, async (reaction) => {
        if (reaction.me) return;
        try {
            if (!reaction.message.guild) return;
            await reaction.fetch();
        }
        catch (error) {
            console.error('reactionAdd error : ', error);
        }
        checkReaction(reaction, 'add');
    });

/**
 * Fonction qui gère le starboard
 * @param {*} reaction La réaction ajoutée ou retirée
 * @param {*} AddOrRemove Si la réaction a été ajoutée ou retirée
 * @returns
 */
    async function starboard(reaction, AddOrRemove) {
        console.log('-------------starboard-------------');


        try {
            let existingTag = await Tags.findOne({ where: { linkedEmbed: reaction.message.id } });
            let messageAttachment = null; // initialize messageAttachment to null

            if (existingTag === null) {
                existingTag = await Tags.findOne({ where: { messageID: reaction.message.id } });
                if (existingTag === null) {
                    console.log('-------Création du tag-------');


                    // Check if the message has an image attachment
                    if (reaction.message.attachments.size > 0) {
                        const attachment = reaction.message.attachments.first();
                        if (attachment.contentType.startsWith('image/')) {
                            messageAttachment = attachment.url;
                        }
                    }
                    // If a tag doesn't already exist, create one
                    // eslint-disable-next-line no-unused-vars
                    const tag = await Tags.create({
                        messageID: reaction.message.id,
                        messageAuthorName: reaction.message.author.username,
                        messageAuthorId: reaction.message.author.id,
                        messageAuthorAvatar: reaction.message.author.displayAvatarURL(),
                        messageURL: reaction.message.url,
                        reactCount: reaction.count,
                        attachment: messageAttachment,
                        posted: false,
                        linkedEmbed: null,
                    });
                    return console.log(' Contenu du tag: \n' + 'MessageID: ' + tag.messageID + '\nMessageAuthorName: '
                        + tag.messageAuthorName + '\nMessageAuthorId: ' + tag.messageAuthorId + '\nMessageAuthorAvatar: ' + tag.messageAuthorAvatar
                        + '\nMessageURL: ' + tag.messageURL + '\nReactCount: ' + tag.reactCount + '\nAttachment: '
                        + tag.attachment + '\nPosted: ' + tag.posted + '\nLinkedEmbed: ' + tag.linkedEmbed + '\n -> Tag créé \n---------------------------');

                } else {
                    console.log(' -> Tag existant sans embed');
                }
            } else {
                console.log(' -> Tag existant avec embed');
            }

            (AddOrRemove === 'add') ? existingTag.reactCount++ : existingTag.reactCount--;
            existingTag.save();

            const realReactCount = existingTag.reactCount - 1; // On retire 1 au compteur de réaction pour éviter de compter le bot
            const starboardEmbed = new EmbedBuilder()
                .setColor('#EBBC4E')
                .setTitle('🌟 ' + realReactCount + ' | de ' + existingTag.messageURL)
                .setAuthor({ name: existingTag.messageAuthorName, iconURL: existingTag.messageAuthorAvatar, url: existingTag.messageURL })
                .setImage(existingTag.attachment)
                .setFooter({ text: 'Message ID: ' + existingTag.messageID });

            const starboardChannel = client.channels.cache.get('1153607344505245736'); // le channel du starboard
            // Si le message n'a pas encore été posté et qu'il a plus de 15 réactions, on poste un nouvel embed
            if (!existingTag.posted && existingTag.reactCount > 15) {
                console.log(' -> Création de l\'embed');
                existingTag.posted = true;
                existingTag.save();
                const message = await starboardChannel.send({ embeds: [starboardEmbed] });
                await message.react('🌟');
                const sendMessageID = message.id;
                existingTag.linkedEmbed = sendMessageID;
                existingTag.save();

                // Si le message a déjà été posté et qu'il a plus de 15 réactions, on modifie l'embed
            } else if (existingTag.posted && existingTag.reactCount > 14) {
                console.log(' -> Modification de l\'embed');
                const message = await starboardChannel.messages.fetch(existingTag.linkedEmbed);
                message.edit({ embeds: [starboardEmbed] });

                // Si le message a déjà été posté et qu'il a moins de 15 réactions, on supprime l'embed
            } else if (existingTag.posted && existingTag.reactCount < 15) {
                console.log(' -> Suppression de l\'embed');
                existingTag.posted = false;
                existingTag.save();
                const message = await starboardChannel.messages.fetch(existingTag.linkedEmbed);
                message.delete();

            }
        }
        catch (error) {
            console.error('Une erreur est survenue lors d\'un rajout d\'émoji: ', error);
        }
        console.log('-----------------------------------');
    }

    async function checkReaction(reaction, addOrRemove) {
        if (reaction.message.channel.id === '1079499858064441344' || reaction.message.channel.id === '1153607344505245736') {
            starboard(reaction, addOrRemove);
        }
    }
};