import { Command } from 'commander';
import { pushRefPack } from '../lib/push.js';

export const pushCommand = new Command('push')
  .description('POST ZIP to /packages, expect JSON {"success":true}')
  .requiredOption('--package <file>', 'RefPack ZIP file to push')
  .requiredOption('--api-url <url>', 'API URL for registry')
  .requiredOption('--api-key <key>', 'API key for authentication')
  .action(async (opts) => {
    try {
      await pushRefPack(opts.package, opts.apiUrl, opts.apiKey);
      console.log('Push successful');
    } catch (err) {
      console.error('Push failed:', err.message);
      process.exit(1);
    }
  });
