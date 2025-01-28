const { SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder, ComponentType } = require('discord.js');

module.exports = {
    category: 'moderation',
    data: new SlashCommandBuilder()
        .setName('sanction')
        .setDescription('Applique une sanction à un utilisateur en fonction de son infraction')
        .addUserOption(option =>
            option.setName('utilisateur')
                .setDescription('L\'utilisateur à sanctionner')
                .setRequired(true)
        ),
    async execute(interaction) {
        const user = interaction.options.getUser('utilisateur');

        await interaction.deferReply({ ephemeral: true });

        // Menu déroulant des infractions
        const menu = new StringSelectMenuBuilder()
            .setCustomId('sanction_menu')
            .setPlaceholder('Choisissez une infraction')
            .addOptions([
                { label: 'Insulte (Warn)', value: 'warn_insulte' },
                { label: 'Pub (Ban)', value: 'ban_pub' },
                { label: 'Troll (Ban)', value: 'ban_troll' },
            ]);

        const row = new ActionRowBuilder().addComponents(menu);

        await interaction.editReply({
            content: `Choisissez une infraction pour <@${user.id}> :`,
            components: [row],
        });

        const filter = i => i.customId === 'sanction_menu' && i.user.id === interaction.user.id;

        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            componentType: ComponentType.StringSelect,
            time: 15000,
        });

        collector.on('collect', async i => {
            const action = i.values[0]; // Exemple : 'warn_insulte', 'ban_pub', 'ban_troll'
            const reason = action.split('_')[1] || 'Raison par défaut';

            if (action.startsWith('warn')) {
                try {
                    // Directly call /warn
                    await interaction.client.commands.get('warn').execute({
                        ...interaction,
                        options: {
                            getUser: () => user,
                            getString: () => reason,
                        },
                    });

                    await i.update({
                        content: `<@${user.id}> a été averti pour : **${reason}**.`,
                        components: [],
                    });
                } catch (error) {
                    console.error('Erreur lors de l\'exécution de la commande /warn :', error);
                    if (!i.replied) {
                        await i.update({ content: 'Une erreur est survenue lors de la sanction.', components: [] });
                    }
                }
            } else if (action.startsWith('ban')) {
                try {
                    // Directly call /ban
                    await interaction.client.commands.get('ban').execute({
                        ...interaction,
                        options: {
                            getUser: () => user,
                            getString: () => reason,
                        },
                    });

                    await i.update({
                        content: `<@${user.id}> a été banni pour : **${reason}**.`,
                        components: [],
                    });
                } catch (error) {
                    console.error('Erreur lors de l\'exécution de la commande /ban :', error);
                    if (!i.replied) {
                        await i.update({ content: 'Une erreur est survenue lors de la sanction.', components: [] });
                    }
                }
            }
        });

        collector.on('end', async collected => {
            if (collected.size === 0) {
                if (!interaction.replied) {
                    await interaction.editReply({ content: 'Aucune infraction choisie.', components: [] });
                }
            }
        });
    },
};
