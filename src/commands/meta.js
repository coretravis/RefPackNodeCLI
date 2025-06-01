import { Command } from 'commander';
import { fetchMeta } from '../lib/meta.js';

export const metaCommand = new Command('meta')
  .description('GET /packages/{id}/meta?version={v}, prints JSON manifest')
  .requiredOption('--id <id>', 'Package id')
  .requiredOption('--version <version>', 'Version')
  .option('--api-url <url>', 'API URL for registry')
  .action(async (opts) => {
    try {
      const meta = await fetchMeta(opts.id, opts.version, opts.apiUrl);
      console.log(JSON.stringify(meta, null, 2));
    } catch (err) {
      console.error('Meta fetch failed:', err.message);
      process.exit(1);
    }
  });
