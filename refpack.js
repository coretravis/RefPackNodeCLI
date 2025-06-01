#!/usr/bin/env node
import { Command } from 'commander';
import { packCommand } from './src/commands/pack.js';
import { validateCommand } from './src/commands/validate.js';
import { pushCommand } from './src/commands/push.js';
import { pullCommand } from './src/commands/pull.js';
import { metaCommand } from './src/commands/meta.js';
import { scaffoldCommand } from './src/commands/scaffold.js';

const program = new Command();

const asciiArt = `
██████╗ ███████╗███████╗██████╗  █████╗  ██████╗██╗  ██╗
██╔══██╗██╔════╝██╔════╝██╔══██╗██╔══██╗██╔════╝██║ ██╔╝
██████╔╝█████╗  █████╗  ██████╔╝███████║██║     █████╔╝ 
██╔══██╗██╔══╝  ██╔══╝  ██╔═══╝ ██╔══██║██║     ██╔═██╗ 
██║  ██║███████╗██║     ██║     ██║  ██║╚██████╗██║  ██╗
╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝     ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝
`;

program
    .name('refpack')
    .description(`${asciiArt}

Streamline your dataset workflow with powerful packaging, validation, 
and registry management tools.`)
    .version('1.0.0');

program.addCommand(packCommand);
program.addCommand(validateCommand);
program.addCommand(pushCommand);
program.addCommand(pullCommand);
program.addCommand(metaCommand);
program.addCommand(scaffoldCommand);

program.parse(process.argv);