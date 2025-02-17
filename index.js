/* eslint-disable no-inline-comments */
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, Partials, EmbedBuilder, AuditLogEvent } = require('discord.js');
const { token } = require('./MainConfig.json'); // Import the token
const logger = require('./logger'); // Import the logger

const client = new Client({
	intents: [
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.MessageContent
	],
	partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

logger.debug('-- loading events --');

// Récupère et lance les événements
const eventFolderPath = path.join(__dirname, 'events/.'); // le chemin des dossiers d'événements
const eventFolders = fs.readdirSync(eventFolderPath); // le dossier des événements
for (const folder of eventFolders) {
	const eventsPath = path.join(eventFolderPath, folder);
	const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
	for (const file of eventFiles) {
		logger.debug(`${folder.charAt(0).toUpperCase() + folder.slice(1)}${file.slice(0, -3)}`);
		try {
			const filePath = path.join(eventsPath, file);
			const event = require(filePath);
			event(client);
		} catch (error) {
			return logger.error(`Error loading event: ${file} \n${error}`);
		}
	}
}

logger.debug('-- loading commands --');

// Récupère les commandes
client.commands = new Collection(); // permet de faire fonctionner les commandes
client.cooldowns = new Collection(); // permet de faire fonctionner les cooldowns des commandes
const foldersPath = path.join(__dirname, 'commands/.'); // le chemin des dossiers de commandes
const commandFolders = fs.readdirSync(foldersPath); // le dossier des commandes
for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		}
		else {
			logger.error(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

client.login(token);
