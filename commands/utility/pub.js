const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

// In-memory storage for reminders
const reminders = [];

module.exports = {
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('pub')
        .setDescription('Créer un rappel pour un partenariat avec un serveur')
        .addStringOption(option =>
            option.setName('serveur')
                .setDescription('Nom du serveur partenaire')
                .setRequired(true)),
    async execute(interaction) {
        const serveurPartenaire = interaction.options.getString('serveur');
        const responsable = interaction.user; // Prend l'utilisateur exécutant la commande par défaut

        // Dates
        const dateCreation = new Date();
        const dateRappel = new Date(dateCreation);
        dateRappel.setMonth(dateCreation.getMonth() + 1); // Ajouter 1 mois

        // Check if the user has the required role
        const requiredRole = interaction.guild.roles.cache.find(role => role.name === 'Staff');
        if (!requiredRole || !interaction.member.roles.cache.has(requiredRole.id)) {
            return interaction.reply({
                content: 'Tu n\'as pas le rôle nécessaire pour utiliser cette commande.',
                ephemeral: true,
            });
        }

        // Save reminder in memory
        reminders.push({
            serveur: serveurPartenaire,
            responsableId: responsable.id,
            dateCreation,
            dateRappel,
            guildId: interaction.guild.id,
            channelId: interaction.channel.id,
        });

        // Create an embed to confirm the creation of the reminder
        const rappelEmbed = new EmbedBuilder()
            .setColor('#FFD700') // Couleur dorée
            .setTitle(`Rappel pour ${serveurPartenaire}`)
            .setDescription(`Voici le rappel pour le partenariat effectué avec le serveur **${serveurPartenaire}**.`)
            .addFields(
                { name: 'Contact', value: `**Serveur partenaire :** ${serveurPartenaire}\n**Responsable LP :** <@${responsable.id}>` },
                { name: 'Dates', value: `**Date de création :** ${dateCreation.toLocaleDateString()}\n**Le rappel sera envoyé le :** ${dateRappel.toLocaleDateString()}` }
            )
            .setFooter({ text: `Rappel créé le : ${dateCreation.toLocaleDateString()} - ${dateCreation.toLocaleTimeString()}` })
            .setTimestamp();

        await interaction.reply({ embeds: [rappelEmbed], ephemeral: false });
    },
};

// Reminder scheduler
setInterval(async () => {
    const now = new Date();

    // Filter reminders that are due
    const dueReminders = reminders.filter(reminder => reminder.dateRappel <= now);

    for (const reminder of dueReminders) {
        try {
            const channel = await interaction.client.channels.fetch(reminder.channelId);
            if (!channel) continue;

            const rappelEmbed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle(`Rappel pour ${reminder.serveur}`)
                .setDescription(`Voici le rappel pour le partenariat effectué avec le serveur **${reminder.serveur}**.`)
                .addFields(
                    { name: 'Contact', value: `**Responsable LP :** <@${reminder.responsableId}>` },
                    { name: 'Dates', value: `**Date de création :** ${reminder.dateCreation.toLocaleDateString()}\n**Date de rappel :** ${reminder.dateRappel.toLocaleDateString()}` }
                )
                .setTimestamp();

            await channel.send({ content: `📢 **Rappel pour le serveur ${reminder.serveur}**`, embeds: [rappelEmbed] });
        } catch (error) {
            console.error('Erreur lors de l\'envoi du rappel :', error);
        }

        // Remove the reminder from memory
        reminders.splice(reminders.indexOf(reminder), 1);
    }
}, 30 * 1000); // Check reminders every 30 seconds
