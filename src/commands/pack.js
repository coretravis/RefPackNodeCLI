import { Command } from 'commander';
import { createRefPackZip } from '../lib/pack.js';

export const packCommand = new Command('pack')
  .description('Validate folder, then create <id>-<version>.refpack.zip')
  .requiredOption('--input <folder>', 'Input folder to pack')
  .requiredOption('--output <file>', 'Output ZIP file')
  .requiredOption('--sign-key <pem>', 'Private key PEM file for signing manifest')
  .requiredOption('--key-id <kid>', 'Key ID for JWS header')
  .action(async (opts) => {
    try {
      await createRefPackZip(opts.input, opts.output, opts.signKey, opts.keyId);
      console.log('Pack complete:', opts.output);
    } catch (err) {
      console.error('Pack failed:', err.message);
      process.exit(1);
    }
  });
