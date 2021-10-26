import { DMChannel } from 'discord.js';
import { ComponentHandlerFunction } from '../interfaces/ComponentHandler';

export const handler: ComponentHandlerFunction = async (
    client,
    interaction
) => {  
    interaction.reply({content: "Acknowledged button click!", ephemeral: true})
};

export const pattern: RegExp = /^example_.+$/;
