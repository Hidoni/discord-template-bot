import {
    SlashCommandBuilder,
} from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import Bot from '../client/Bot';
import { CommandHandler } from '../interfaces/Command';

export const handler: CommandHandler = async (
    client: Bot,
    interaction: CommandInteraction
) => {
    interaction.reply(`Pong! (${client.ws.ping} MS)`);
};
export const builder = new SlashCommandBuilder()
    .setName('ping')
    .setDescription("Checks the bot's ping.");
