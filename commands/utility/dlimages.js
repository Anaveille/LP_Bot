const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const axios = require('axios');
const path = require('path');
const archiver = require('archiver');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('downloadimages')
        .setDescription("Télécharge les images, compte les réactions et affiche le gagnant."),
        
    async execute(interaction) {
        await interaction.deferReply(); // Préviens Discord que le bot va répondre

        const channel = interaction.channel;
        let messages = await channel.messages.fetch({ limit: 100 });

        let images = [];
        let reactionCounts = []; // Stocke les réactions des images

        messages.forEach(msg => {
            if (msg.attachments.size > 0) {
                msg.attachments.forEach(attachment => {
                    if (attachment.contentType && attachment.contentType.startsWith('image')) {
                        images.push({
                            url: attachment.url,
                            author: msg.author.username,
                            authorId: msg.author.id,
                            messageId: msg.id,
                            reactions: msg.reactions.cache.reduce((acc, reaction) => acc + reaction.count, 0) // Total des réactions
                        });
                    }
                });
            }
        });

        if (images.length === 0) {
            return interaction.editReply("⚠️ Aucune image trouvée dans les 100 derniers messages.");
        }

        // Trouver l'image avec le plus de réactions
        let bestImage = images.reduce((max, img) => (img.reactions > max.reactions ? img : max), images[0]);

        // 📂 Dossier temporaire
        const tempDir = path.join(__dirname, '../../temp/');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        let imageFiles = [];

        for (let i = 0; i < images.length; i++) {
            const url = images[i].url;
            const filename = `image_${i}.jpg`;
            const filePath = path.join(tempDir, filename);
            const response = await axios.get(url, { responseType: 'arraybuffer' });

            fs.writeFileSync(filePath, response.data);
            imageFiles.push(filePath);
        }

        // 🔄 Création du fichier ZIP
        const zipPath = path.join(tempDir, 'images.zip');
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        archive.pipe(output);
        imageFiles.forEach(file => archive.file(file, { name: path.basename(file) }));
        await archive.finalize();

        // 📤 Envoi du fichier ZIP sur Discord (Ce message sera supprimé)
        const zipFile = new AttachmentBuilder(zipPath, { name: 'images.zip' });

        const zipMessage = await interaction.editReply({ content: `📁 Voici un fichier ZIP contenant ${images.length} images.`, files: [zipFile] });

        // 🏆 Envoi du message du gagnant (Ce message RESTE affiché)
        const winnerEmbed = new EmbedBuilder()
            .setTitle("🏆 Le gagnant du concours d'images ! 🏆")
            .setColor("#FFD700")
            .setDescription(`🎉 **${bestImage.author}** a gagné avec **${bestImage.reactions} réactions !**`)
            .setImage(bestImage.url)
            .setFooter({ text: "Félicitations au gagnant !" });

        await interaction.followUp({ embeds: [winnerEmbed] });

        // 🕒 Supprime SEULEMENT le message contenant le fichier ZIP après 30 secondes
        setTimeout(async () => {
            try {
                await zipMessage.delete();
            } catch (error) {
                console.error("Erreur lors de la suppression du message ZIP :", error);
            }
        }, 30000); // Supprime après 30 secondes

        // 🧹 Nettoyage des fichiers locaux après 30 secondes
        setTimeout(() => {
            fs.unlinkSync(zipPath);
            imageFiles.forEach(file => fs.unlinkSync(file));
        }, 30000); // 30s avant suppression des fichiers
    },
};
