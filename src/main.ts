import { Client, GatewayIntentBits, TextChannel } from 'discord.js';
import dotenv from 'dotenv';
import { DiscordHandle } from './event/discordHandle';

let discordHandle: DiscordHandle; // DiscordHandle 類的實例

dotenv.config();

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent
	]
});

client.once('ready', () => {
	discordHandle = new DiscordHandle();
	console.log(`Ready! Logged in as ${client.user!.tag}`); // 使用非空斷言(!)
});

client.on('messageCreate', message => {
	if (message.author.bot) return;
	
	if ((message.channel as TextChannel).name === 'your-channel-name' && message.mentions.has(client.user!)) {
		discordHandle.displayBtnOptions(message);
	}
});

client.on('interactionCreate', interaction => {
	if (interaction.isButton()) {
		discordHandle.handleBtnInteraction(interaction)
	}
});

client.login(process.env.TOKEN);
