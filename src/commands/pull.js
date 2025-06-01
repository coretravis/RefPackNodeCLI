import { Command } from 'commander';
import { pullRefPack } from '../lib/pull.js';

export const pullCommand = new Command('pull')
  .description('GET /packages/{id}?version={v}, saves ZIP or extracts folder')
  .requiredOption('--id <id>', 'Package id to pull')
  .requiredOption('--version <version>', 'Version to pull')
  .requiredOption('--dest <folder>', 'Destination folder or ZIP file')
  .option('--api-url <url>', 'API URL for registry')
  .action(async (opts) => {
    try {
      await pullRefPack(opts.id, opts.version, opts.dest, opts.apiUrl);
      console.log('Pull successful');
    } catch (err) {
      console.error('Pull failed:', err.message);
      process.exit(1);
    }
  });
