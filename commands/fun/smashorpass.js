const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('forcesmashorpass')
        .setDescription('Force the smash or pass command to run.')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    async execute(interaction) {
        // IDs des catégories à scanner
    const categoryIds = ['917158866943377509', '916879499386294292', '917202603195125780', '993871861811269704', '1039226609623912560', '916089088019427358'];

    // Liste pour stocker les salons des catégories spécifiées
    const eligibleChannels = [];

    // Parcourt toutes les guilds accessibles au bot
    interaction.client.guilds.cache.forEach(guild => {
        // Filtre les salons appartenant aux catégories spécifiées
        const channels = guild.channels.cache.filter(channel =>
            channel.isTextBased() &&
            channel.parentId &&
            categoryIds.includes(channel.parentId)
        );

        eligibleChannels.push(...channels.values());
    });

    if (eligibleChannels.length === 0) {
        console.log('Aucun salon éligible trouvé dans les catégories spécifiées.');
        return;
    }

    // Sélectionne un salon aléatoire
    const randomChannel = eligibleChannels[Math.floor(Math.random() * eligibleChannels.length)];
    console.log(`Salon sélectionné : ${randomChannel.name} (ID: ${randomChannel.id})`);

    // Récupère les messages du salon sélectionné
    try {
        const messages = await randomChannel.messages.fetch({ limit: 100 });
        const images = [];

        messages.forEach(message => {
            if (message.attachments.size > 0) { // Vérifie si le message a des fichiers attachés
                message.attachments.forEach(attachment => {
                    if (attachment.contentType && attachment.contentType.startsWith('image/')) {
                        images.push({
                            url: attachment.url,
                            name: attachment.name,
                            messageUrl: message.url,
                            authorTag: message.author.tag,
                            authorId: message.author.id
                        });
                    }
                });
            }
        });

        if (images.length === 0) {
            console.log(`Aucune image trouvée dans le salon ${randomChannel.name}.`);
            return;
        }

        // Sélectionne une image au hasard
        const randomImage = images[Math.floor(Math.random() * images.length)];
        console.log(`Image sélectionnée : ${randomImage.url}`);

        // Poste l'image dans un autre salon (par exemple, un salon spécifique)
        const targetChannelId = '1052597309759828098'; // ID du salon cible
        const targetChannel = interaction.client.channels.cache.get(targetChannelId);

        if (targetChannel && targetChannel.isTextBased()) {
            await targetChannel.send('Nouveau poste ! <@&1163093412812177599>');
            const embed = new EmbedBuilder()
                .setTitle('✅ Smash or Pass ? ❌')
                .setDescription(`- Image postée par : **<@${randomImage.authorId}>** \n- Salon d'origine : ${randomImage.messageUrl}`)
                .setImage(randomImage.url)
                .setColor('#EBBC4E')
                .setFooter({
                    text: 'Lewd Paradise au service de tout les hornys',
                    iconURL: 'https://i.imgur.com/PQtvZLa.gif',
                });

            const message = await targetChannel.send({ embeds: [embed] });
            await message.react('<a:LP_FoxxoWow:1090350412323901490>');
            await message.react('<:LP_FoxxoHmph:1090351249360179220>');
            console.log('Image postée avec succès !');
        } else {
            console.log('Le salon cible est introuvable ou non textuel.');
        }
    } catch (error) {
        console.error(`Erreur lors de la récupération des messages du salon ${randomChannel.id}:`, error);
    }
        await interaction.reply('Forcing the smash or pass command to run.');
    },
};

async function smashOrPass() {
    
}