const { REST, Routes } = require('discord.js');
const { clientId, guildId, token } = require('./MainConfig.json');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('crypto');

const commands = [];
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

const metadataPath = path.join(__dirname, 'commands.json');

// Charger ou initialiser les métadonnées des versions
let commandVersions = {};
if (fs.existsSync(metadataPath)) {
    commandVersions = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
}

// Fonction pour calculer le hash d'un fichier
function getFileHash(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    return crypto.createHash('md5').update(content).digest('hex');
}

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);

        if ('data' in command && 'execute' in command) {
            // Récupérer le nom de la commande
            const commandName = command.data.name;
            const fileHash = getFileHash(filePath);

            // Vérifier les versions
            if (commandVersions[commandName] && commandVersions[commandName].hash !== fileHash) {
                // Incrémenter la version
                let oldVersion = parseFloat(commandVersions[commandName].version);
                commandVersions[commandName] = {
                    version: (oldVersion + 0.01).toFixed(2),
                    hash: fileHash
                };
            } else if (!commandVersions[commandName]) {
                // Nouvelle commande : initialiser la version
                commandVersions[commandName] = {
                    version: "1.00",
                    hash: fileHash
                };
            }

            // Ajouter la version dans les données de la commande
            command.data.setDescription(`${command.data.description} (v${commandVersions[commandName].version})`);

            commands.push(command.data.toJSON());

            console.log(`Commande chargée: ${commandName} v${commandVersions[commandName].version}`);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

// Sauvegarder les métadonnées mises à jour
fs.writeFileSync(metadataPath, JSON.stringify(commandVersions, null, 4));

const rest = new REST().setToken(token);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        const data = await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
		process.exit();
    } catch (error) {
        console.error(error);
    }
})();
