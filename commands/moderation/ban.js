const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { bans, badUsers: badUserModel, staffMembers } = require('../../database.js');

module.exports = {
	category: 'moderation',
	data: new SlashCommandBuilder()
		.setName('ban')
		.addStringOption(option => option.setName('raison').setDescription('La raison du ban').setRequired(true))
		.addUserOption(option => option.setName('utilisateur').setDescription('La personne à bannir').setRequired(true))
		.setDescription('Ban un utilisateur du serveur'),
	async execute(interaction) {
		await interaction.reply({ content: 'Ban en cours...', ephemeral: true });

		const staff = interaction.member.user;
		const staffId = staff.id;

		// Récupération de l'utilisateur
		const user = await getUser(interaction);
		if (!user) return;

		const userId = user.id;
		const member = await getGuildMember(interaction.guild, userId);

		// Vérification des permissions
		if (!(await isStaffMember(staffId))) {
			return interaction.editReply({ content: 'Tu n\'es pas un staff', ephemeral: true });
		}

		// Bannir l'utilisateur
		try {
			const raison = interaction.options.getString('raison');
			await sendBanNotification(interaction, user, member, staff);
			await interaction.guild.members.ban(userId, { reason: raison });
			await addBanToDatabase(user, staffId, raison);
			await interaction.editReply({ content: 'Utilisateur banni.', ephemeral: true });
		} catch (error) {
			console.error('Erreur lors du ban de l\'utilisateur:', error);
			return interaction.editReply({ content: 'Erreur lors du ban de l\'utilisateur.', ephemeral: true });
		}

		// Supprimer les messages après le ban
		await interaction.editReply({ content: 'Utilisateur banni.\nSuppression des messages...', ephemeral: true });
		await deleteAllUserMessages(interaction.guild, userId);

		// Finaliser
		await interaction.editReply({ content: 'Ban et suppression des messages terminés.', ephemeral: true });
		await interaction.deleteReply({ timeout: 2000 });
	},
};

async function getUser(interaction) {
	let user = interaction.options.getUser('utilisateur');
	const userId = interaction.options.getString('user_id') || (user && user.id);

	if (!user && userId) {
		try {
			user = await interaction.client.users.fetch(userId);
		} catch {
			await interaction.editReply({ content: 'Utilisateur introuvable avec cet ID.', ephemeral: true });
			return null;
		}
	}

	if (!user) {
		await interaction.editReply({ content: 'Vous devez fournir un utilisateur ou un ID.', ephemeral: true });
		return null;
	}

	return user;
}

async function getGuildMember(guild, userId) {
	try {
		return await guild.members.fetch(userId);
	} catch {
		return null;
	}
}

async function isStaffMember(staffId) {
	return await staffMembers.findOne({ where: { sm_user_id: staffId } });
}

async function deleteAllUserMessages(guild, userId) {
	const textChannels = guild.channels.cache.filter(
		channel => channel.isTextBased() && channel.permissionsFor(guild.members.me).has(['ViewChannel', 'ReadMessageHistory', 'ManageMessages'])
	);
	const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000; // Discord limite la suppression à 14 jours

	for (const [channelId, channel] of textChannels) {
		try {
			let fetchedMessages;
			do {
				// Récupérer jusqu'à 100 messages du canal
				fetchedMessages = await channel.messages.fetch({ limit: 100 });

				// Filtrer les messages de l'utilisateur et ceux qui datent de moins de 14 jours
				const userMessages = fetchedMessages.filter(
					msg => msg.author.id === userId && msg.createdTimestamp >= fourteenDaysAgo
				);

				// Supprimer chaque message de l'utilisateur
				for (const msg of userMessages.values()) {
					await msg.delete();
				}

				// Arrêter la boucle si aucun message récent de l'utilisateur n'est trouvé
				if (userMessages.size === 0) break;

			} while (fetchedMessages.size >= 100);

			console.log(`Messages récents de l'utilisateur ${userId} supprimés dans le canal ${channel.name}.`);
		} catch (error) {
			console.error(`Erreur lors de la suppression des messages dans le canal ${channel.name}:`, error);
		}
	}

	console.log(`Messages récents de l'utilisateur ${userId} supprimés dans tous les canaux.`);
}

async function handleBadUser(user) {
	const badUser = await badUserModel.findOne({ where: { bu_id: user.id } });
	if (!badUser) {
		try {
			await badUserModel.create({
				bu_id: user.id,
				bu_name: user.username,
			});
		} catch (error) {
			console.log('Contrainte de clé unique violée sur la table badUsers');
		}
	}
}

async function addBanToDatabase(user, staffId, raison) {
	const foundBadUser = await badUserModel.findOne({ where: { bu_id: user.id } });
	const fkBadUser = foundBadUser.pk_badUsers;

	const staffMemberId = await staffMembers.findOne({ where: { sm_user_id: staffId } });
	const fkStaffMember = staffMemberId.pk_staffMembers;

	try {
		await bans.create({
			ba_reason: raison,
			ba_date: new Date(),
			ba_fk_badUsers: fkBadUser,
			ba_fk_staffMembers: fkStaffMember,
		});
	} catch (error) {
		console.log('Erreur lors du rajout du ban dans la base de données');
	}
}

async function sendBanNotification(interaction, user, member, staff) {
	const raison = interaction.options.getString('raison');

	// Notification à l'utilisateur
	if (member) {
		const embedToUser = new EmbedBuilder()
			.setColor('#FF0000')
			.setTitle('Ban')
			.setDescription('Vous avez été banni')
			.addFields(
				{ name: 'Raison', value: raison },
				{ name: 'Staff', value: `<@${staff.id}>` },
			)
			.setTimestamp()
			.setThumbnail(staff.avatarURL());
		try {
			await member.send({ embeds: [embedToUser] });
		} catch (error) {
			console.log(error);
		}
	}

	// Ban l'utilisateur
	try {
		await interaction.guild.members.ban(user.id, { reason: raison });
	} catch (error) {
		console.log('Erreur lors du ban de l\'utilisateur' + error);
	}

	// Log du ban
	try {
		const channel = interaction.guild.channels.cache.find(channel => channel.name === 'ban-log');
		const embed = new EmbedBuilder()
			.setColor('#FF0000')
			.setTitle('Ban')
			.setDescription('Un utilisateur a été banni')
			.addFields(
				{ name: 'Utilisateur', value: `<@${user.id}>` },
				{ name: 'Raison', value: raison },
				{ name: 'Staff', value: `<@${staff.id}>` },
			)
			.setTimestamp()
			.setThumbnail(user.avatarURL());
		channel.send({ embeds: [embed] });
	} catch (error) {
		console.log('Erreur lors de l\'envoie du log' + error);
	}
}
