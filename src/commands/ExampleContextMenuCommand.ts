import { ContextMenuCommandBuilder } from '@discordjs/builders';
import { ApplicationCommandType } from 'discord-api-types/v9';
import {
    ContextMenuInteraction,
    MessageActionRow,
    MessageButton,
} from 'discord.js';
import Bot from '../client/Bot';
import { ContextMenuHandler } from '../interfaces/Command';

export const handler: ContextMenuHandler = async (
    client: Bot,
    interaction: ContextMenuInteraction
) => {
    const message = await interaction.channel?.messages.fetch(
        interaction.targetId!
    );
    if (!message) {
        throw new Error(
            `Could not fetch message with id ${interaction.targetId}`
        );
    }
    await message.delete();
    const componentRow = new MessageActionRow().addComponents(
        new MessageButton()
            .setCustomId('example_ACKNOWLEDGE')
            .setEmoji('✔')
            .setStyle('PRIMARY')
    );
    interaction.reply({
        content: 'Message deleted.',
        ephemeral: true,
        components: [componentRow],
    });
};
export const builder = new ContextMenuCommandBuilder()
    .setName('Delete User Message')
    .setType(ApplicationCommandType.Message);
export const guildOnly: ((interaction: ContextMenuInteraction) => boolean) = () => true;
