const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { warns, staffMembers, badUsers: badUserModel } = require('../../database.js');

module.exports = {
	category: 'moderation',
	data: new SlashCommandBuilder()
		.setName('warn')
		.setDescription('Warn un utilisateur du serveur')
		.addUserOption(option =>
			option.setName('utilisateur')
				.setDescription('L\'utilisateur à warnir')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('raison')
				.setDescription('La raison du warn')
				.setRequired(true)),
	async execute(interaction) {
		try {
			// // Différer la réponse
			// await interaction.deferReply({ ephemeral: true });             OLD ONE BACKUP

			if (!interaction.deferred) {
				await interaction.deferReply({ ephemeral: true });
			}
			

			// Vérifier le rôle requis
			const requiredRole = interaction.guild.roles.cache.find(role => role.name === 'Staff');
			if (!interaction.member.roles.cache.has(requiredRole.id)) {
				return interaction.editReply({ content: 'Vous n\'avez pas les permissions nécessaires pour utiliser cette commande.', ephemeral: true });
			}

			// Récupération des options
			const user = interaction.options.getUser('utilisateur');
			const raison = interaction.options.getString('raison');
			const staff = interaction.member.user;

			// Vérifier si l'utilisateur est un staff
			const isStaff = await staffMembers.findOne({ where: { sm_user_id: user.id } });
			if (isStaff) {
				return interaction.editReply({ content: 'Vous ne pouvez pas warn un membre de la modération.', ephemeral: true });
			}

			// Vérifier si le staff est autorisé
			const staffMember = await staffMembers.findOne({ where: { sm_user_id: staff.id } });
			if (!staffMember) {
				return interaction.editReply({ content: 'Vous n\'êtes pas un membre du staff.', ephemeral: true });
			}

			// Ajouter l'utilisateur aux badUsers si nécessaire
			const warnUser = await badUserModel.findOrCreate({
				where: { bu_id: user.id },
				defaults: { bu_id: user.id, bu_name: user.username },
			});

			// Ajouter le warn dans la base de données
			const fkBadUser = warnUser[0].pk_badUsers;
			await warns.create({
				wa_date: new Date(),
				wa_fk_badUserId: fkBadUser,
				wa_fk_staffMemberId: staffMember.pk_staffMembers,
				wa_reason: raison,
			});

			// Compter les warns
			const warnCount = await warns.count({ where: { wa_fk_badUserId: fkBadUser } });

			// Vérifier si un bannissement est nécessaire
			if (warnCount >= 3) {
				const member = await interaction.guild.members.fetch(user.id);
				await member.ban({ reason: 'A été warn 3 fois.' });
				await interaction.editReply({ content: `<@${user.id}> a été banni pour avoir accumulé 3 avertissements.`, ephemeral: true });
				console.log("3 WAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARN");
			} else {
				await interaction.editReply({ content: `<@${user.id}> a été averti avec succès.`, ephemeral: true });
				console.log("1 WAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAARN");
			}

			// Envoyer un message au salon de logs
			try {
				const warnEmbed = new EmbedBuilder()
					.setColor('#FF0000')
					.setTitle('Warn')
					.setDescription('Un utilisateur a été averti.')
					.addFields(
						{ name: 'Utilisateur', value: `<@${user.id}>`, inline: true },
						{ name: 'Raison', value: raison, inline: true },
						{ name: 'Staff', value: `<@${staff.id}>`, inline: true }
					)
					.setTimestamp()
					.setThumbnail(user.displayAvatarURL());
				const logChannel = interaction.guild.channels.cache.find(channel => channel.name === 'warn-log');
				if (logChannel) await logChannel.send({ embeds: [warnEmbed] });
			} catch (error) {
				console.error('Erreur lors de l\'envoi du log :', error);
			}

			// Envoyer un message public si applicable
			try {
				const publicChannelId = '1164700276310155264'; // Remplacez avec l'ID réel
				const publicChannel = interaction.guild.channels.cache.get(publicChannelId);

				if (publicChannel) {
					const publicEmbed = new EmbedBuilder()
						.setColor('#FF0000')
						.setTitle('⚠️ Avertissement Public')
						.setAuthor({
							name: interaction.guild.name, // Nom du serveur
							iconURL: interaction.guild.iconURL() // URL de l'icône du serveur
						})						
						.addFields(
							{ name: 'Warn', value: `- <@${user.id}> à été averti pour la raison suivante : ${raison} \n - Responsable : <@${staff.id}>` },
							{ name: `Historique de l'utilisateur`, value: `- Nombre de warns : ${warnCount}` }
						)
						.setFooter({ text: `Warn crée le : ` })
						.setTimestamp()
						.setThumbnail(user.displayAvatarURL());

					await publicChannel.send({ embeds: [publicEmbed] });
				}
			} catch (error) {
				console.error('Erreur lors de l\'envoi du message public :', error);
			}

			// Envoyer un message privé à l'utilisateur
			try {
				await user.send(`Vous avez été averti sur le serveur pour la raison suivante : ${raison}`);
			} catch (error) {
				console.error('Erreur lors de l\'envoi du message privé :', error);
			}
		} catch (error) {
			console.error('Erreur lors de l\'exécution de la commande warn :', error);
			if (!interaction.replied) {
				await interaction.editReply({ content: 'Une erreur est survenue lors de l\'exécution de la commande.', ephemeral: true });
			}
		}
	},
};
