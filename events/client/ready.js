const { Events, ActivityType, EmbedBuilder } = require('discord.js'); // Importer Events
const { Tags } = require('../../database.js'); // Importer la table Tags
const cron = require('cron'); // Importer cron
const logger = require('../../logger'); // Importer logger
const { start } = require('repl');

module.exports = (client) => {

	const crashLogsChannelId = '1333850350867710073'; // ID du channel où envoyer les logs de crash

	process.on('uncaughtException', async (error) => {
		console.error('An unCaugth error has been detected :', error);

		try {
			const errorEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('❌ UnCaught Error ❌')
                    .setDescription(`An uncaugth error has been detected : \n\n\`\`\`${error}\`\`\``)
                    .addFields({
						name: '🔧 Stack trace 🔧',
						value: `\`\`\`${error.stack}\`\`\``,
					})
                    .setImage("https://media1.tenor.com/m/sIB-6LgziVIAAAAC/spongebob-squarepants-spongebob.gif")
                    .setFooter({
                        text: "Lewd Paradise au service de tout les hornys",
                        iconURL: "https://i.imgur.com/PQtvZLa.gif",
                    });

			// Remplace "ID_DU_CHANNEL" par l'ID du channel où tu veux envoyer le message
			const channel = client.channels.cache.get(crashLogsChannelId);
			if (channel && channel.isTextBased()) {
				await channel.send({ embeds: [errorEmbed] });
			}
		} catch (err) {
			console.error('Impossible d\'envoyer le message d\'erreur non géré :', err);
		}
	});

	function startBotLog() {
		const startEmbed = new EmbedBuilder()
			.setColor('#00FF00')
			.setTitle('✅ Bot started ✅')
			.setDescription('The bot has been started successfully !')
			.setImage("https://i.imgur.com/3fUmg6N.png")
			.setFooter({
				text: "Lewd Paradise au service de tout les hornys",
				iconURL: "https://i.imgur.com/PQtvZLa.gif",
			});

		const channel = client.channels.cache.get('1333850350867710073');
		if (channel && channel.isTextBased()) {
			channel.send({ embeds: [startEmbed] });
		} else {
			console.error('Impossible d\'envoyer le message de démarrage du bot');
		}
	}

	/**
     * Tableau des status du bot
     */
	const status = [
		{
			type: ActivityType.Playing,
			name: 'Compte le nombre de votes',
		},
		{
			type: ActivityType.Watching,
			name: 'qui est qualifié',
		},
		{
			name: '.gg/lewd.paradise',
			type: ActivityType.Playing,
			url: 'https://discord.gg/lewd.paradise',
		},
	];

	/**
     * Event start of the bot
     */
	client.once(Events.ClientReady, () => {
		startBotLog()

		setInterval(() => {
			const index = Math.floor(Math.random() * (status.length - 1) + 1);
			client.user.setActivity(status[index].name, { type: status[index].type });
		}, 600000);

		concours();

		const dailyScheduledMessage = new cron.CronJob('0 11 * * *', () => {
			smashOrPass();
		});

		dailyScheduledMessage.start();

		logger.info(`Status : ${client.user.tag} is started`);
	});

	/**
     * Fonction qui gère le concours
     * @returns
     */
	async function concours() {

		const channel = client.channels.cache.get('1277507675915157524');

		const saturdayScheduledMessage = new cron.CronJob('0 10 * * 6', () => {
			channel.send('<@&1239680929958592524>');
			const mondayEmbed = new EmbedBuilder()
				.setColor('#EBBC4E')
				.setTitle('❗ Dernier jour pour poster ❗')
				.addFields({
					name: '🕰️ 24h pour participer 🕰️',
					value: 'Il vous reste un peu moins de 24h pour poster vos images et tenter de gagner le concours de la semaine !',
				})
				.setImage('https://i.imgur.com/3fUmg6N.png')
				.setFooter({
					text: 'Lewd Paradise au service de tout les hornys',
					iconURL: 'https://i.imgur.com/PQtvZLa.gif',
				});
			channel.send({ embeds: [mondayEmbed] });
		});

		const mondayScheduledMessage = new cron.CronJob('0 10 * * 1', () => {
			channel.send('<@&1239680929958592524>');
			let maxReactCount = 0;
			let winner = 0;
			async function run() {

				// Get all tags from the database
				const allTags = await Tags.findAll();

				// Find the max react count among all tags
				maxReactCount = Math.max(...allTags.map(tag => tag.reactCount));

				winner = await Tags.findOne({ where: { reactCount: maxReactCount } });

				console.log(winner.messageID);

				const mondayEmbed = new EmbedBuilder()
					.setTitle('🎉 Annonce du nom du gagnant 🎉')
					.addFields({
						name: '🏆 Qui est le gagnant 🏆',
						value: 'La personne ayant le plus de votes est: \n **<@' + winner.messageAuthorId + '>** ! \n\nFélicitations à lui ! Il gagne avec '
                            + maxReactCount + ' votes et obtient le rôle <@&1052591643544522782> !',
					})
					.setImage('https://i.imgur.com/3fUmg6N.png')
					.setColor('#EBBC4E')
					.setFooter({
						text: 'Lewd Paradise au service de tout les hornys',
						iconURL: 'https://i.imgur.com/PQtvZLa.gif',
					});

				channel.send({ embeds: [mondayEmbed] });

				Tags.sync({ Force: true });
			}
			run();
		});

		const sundayScheduledMessage = new cron.CronJob('0 10 * * 0', () => {
			channel.send('<@&1239680929958592524>');
			const sundayEmbed = new EmbedBuilder()
				.setTitle('🌟 Fin des publications 🌟')
				.setDescription('La phase de publication est terminé !')
				.addFields(
					{
						name: '🗳️ Phase de votes : Choisissez vos préférés ! 🗳️',
						value: '- L\'émoji de vote et le suivant : <:LP_vote:1001230627242250392>\n- Aucune limite de vote est appliqué (nombre de vote infini)\n- Toute image dépassant 15 votes sera affichés dans <#1153607344505245736>',
						inline: false
					},
					{
						name: '🏆 Pour le vainquer 🏆',
						value: '- Le vainqueur est désigné directement par le bot\n- Le gagnant sera récompensé par le rôle <@&1052591643544522782>',
						inline: false
					},
				)
				.setImage('https://i.imgur.com/3fUmg6N.png')
				.setColor('#EBBC4E')
				.setFooter({
					text: 'Lewd Paradise au service de tout les hornys',
					iconURL: 'https://i.imgur.com/PQtvZLa.gif',
				})
				.setTimestamp();
		})

		// When you want to start it, use:
		mondayScheduledMessage.start();
		saturdayScheduledMessage.start();
		sundayScheduledMessage.start();

	}

	async function smashOrPass() {
		// IDs des catégories à scanner
		const categoryIds = ['917158866943377509', '916879499386294292', '917202603195125780', '993871861811269704', '1039226609623912560', '916089088019427358'];

		// Liste pour stocker les salons des catégories spécifiées
		const eligibleChannels = [];

		// Parcourt toutes les guilds accessibles au bot
		client.guilds.cache.forEach(guild => {
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
			const targetChannel = client.channels.cache.get(targetChannelId);

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
	}
}