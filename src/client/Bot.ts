import { Logger } from 'log4js';
import { Client, Collection } from 'discord.js';
import BotConfig from '../interfaces/BotConfig';
import { Command, CommandBuilderType } from '../interfaces/Command';
import { Event } from '../interfaces/Event';
import path from 'path';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import glob from 'glob';
import { ComponentHandler } from '../interfaces/ComponentHandler';

export default class Bot extends Client {
    public logger?: Logger;
    private commands: Collection<string, Command<CommandBuilderType>> =
        new Collection();
    private componentHandlers: Collection<RegExp, ComponentHandler> =
        new Collection();
    private restAPI: REST;
    private config: BotConfig;

    public constructor(config: BotConfig, logger?: Logger) {
        super({ intents: config.intents, partials: config.partials });
        this.config = config;
        this.logger = logger;
        this.restAPI = new REST({ version: '9' }).setToken(config.token);

        if (config.commandsFolder) {
            this.loadCommands(config.commandsFolder);
        }
        if (config.eventsFolder) {
            this.loadEvents(config.eventsFolder);
        }
        if (config.componentHandlersFolder) {
            this.loadComponentHandlers(config.componentHandlersFolder);
        }
    }

    private loadCommands(folder: string) {
        try {
            glob.sync(path.join(folder, '**/*.js')).forEach((file: string) => {
                try {
                    const handler: Command<CommandBuilderType> = require(file);
                    this.commands.set(handler.builder.name, handler);
                } catch (error) {
                    this.logger?.error(
                        `Failed to load command at ${file}: ${error}`
                    );
                }
            });
        } catch (error) {
            this.logger?.error(`Failed to load commands: ${error}`);
        }
    }

    private loadEvents(folder: string) {
        try {
            glob.sync(path.join(folder, '**/*.js')).forEach((file: string) => {
                try {
                    const handler: Event = require(file);
                    this.registerEvent(handler.name, handler);
                } catch (error) {
                    this.logger?.error(
                        `Failed to load event at ${file}: ${error}`
                    );
                }
            });
        } catch (error) {
            this.logger?.error(`Failed to load events: ${error}`);
        }
    }

    private loadComponentHandlers(folder: string) {
        try {
            glob.sync(path.join(folder, '**/*.js')).forEach((file: string) => {
                try {
                    const handler: ComponentHandler = require(file);
                    this.componentHandlers.set(handler.pattern, handler);
                } catch (error) {
                    this.logger?.error(
                        `Failed to load component handler at ${file}: ${error}`
                    );
                }
            });
            this.logger?.info(
                `Succesfully registered ${this.componentHandlers.size} component handlers`
            );
        } catch (error) {
            this.logger?.error(`Failed to load component handlers: ${error}`);
        }
    }

    public getCommand(
        commandName: string
    ): Command<CommandBuilderType> | undefined {
        return this.commands.get(commandName);
    }

    public getComponentHandler(
        componentId: string
    ): ComponentHandler | undefined {
        for (const { 0: idPattern, 1: componentHandler } of this
            .componentHandlers) {
            if (idPattern.test(componentId)) {
                return componentHandler;
            }
        }
        return undefined;
    }

    public async run() {
        this.login(this.config.token);
        await this.registerCommands();
    }

    private registerEvent(eventName: string, event: Event): void {
        let wrapper = async function (bot: Bot) {
            event
                .handler(bot, ...Array.from(arguments).slice(1))
                .catch((error) => {
                    bot.logger?.error(
                        `Failed to execute event ${eventName}: ${error}`
                    );
                });
        }.bind(null, this);
        if (event.once) {
            this.once(eventName, wrapper);
        } else {
            this.on(eventName, wrapper);
        }
        this.logger?.info(
            `Registered event ${eventName} (once=${!!event.once})`
        );
    }

    private assignCommandIds(
        response: { id: string; name: string; type: number }[]
    ) {
        for (const commandData of response) {
            let command = this.commands.find((command) => {
                const json = command.builder.toJSON();
                return (
                    json.name === commandData.name &&
                    json.type === commandData.type
                );
            });
            if (command) {
                command.id = commandData.id;
            } else {
                this.logger?.warn(
                    `Could not find match for command named '${commandData.name}' (type: ${commandData.type})`
                );
            }
        }
    }

    private async registerCommands(): Promise<void> {
        let route = this.config.debugGuildId
            ? Routes.applicationGuildCommands(
                  this.config.appId,
                  this.config.debugGuildId
              )
            : Routes.applicationCommands(this.config.appId);
        try {
            const commandsJSON = this.commands.map((command) =>
                command.builder.toJSON()
            );
            const response = (await this.restAPI.put(route, {
                body: commandsJSON,
            })) as { id: string; name: string; type: number }[];
            this.assignCommandIds(response);
            this.logger?.info(
                `Succesfully registered ${commandsJSON.length} commands`
            );
        } catch (error) {
            this.logger?.error(`Error loading commands: ${error}`);
        }
    }
}
