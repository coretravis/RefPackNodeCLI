// commands/validate.js
import { Command } from 'commander';
import { validateRefPackZip } from '../lib/validate.js';

export const validateCommand = new Command('validate')
  .description('Open a .refpack.zip, verify layout, schemas, and JWS signature')
  .requiredOption('--package <file>', 'RefPack ZIP file to validate')
  .option('--verbose', 'Show detailed validation information')
  .action(async (opts) => {
    try {
      console.log(`Validating RefPack: ${opts.package}`);
      console.log('─'.repeat(50));
      
      const result = await validateRefPackZip(opts.package);
      
      console.log('─'.repeat(50));
      console.log('🎉 Validation successful!');
      console.log('');
      console.log('Package Information:');
      console.log(`  ID: ${result.manifest.id}`);
      console.log(`  Version: ${result.manifest.version}`);
      console.log(`  Title: ${result.manifest.title}`);
      console.log(`  Records: ${result.recordCount}`);
      console.log(`  Signature Key: ${result.signature.keyId}`);
      console.log(`  Algorithm: ${result.signature.algorithm}`);
      
      if (opts.verbose) {
        console.log('');
        console.log('Optional Components:');
        console.log(`  Schema: ${result.hasSchema ? '✓' : '✗'}`);
        console.log(`  Changelog: ${result.hasChangelog ? '✓' : '✗'}`);
        console.log(`  Readme: ${result.hasReadme ? '✓' : '✗'}`);
        console.log(`  Assets: ${result.assetCount} files`);
        
        if (result.manifest.authors?.length) {
          console.log(`  Authors: ${result.manifest.authors.join(', ')}`);
        }
        if (result.manifest.tags?.length) {
          console.log(`  Tags: ${result.manifest.tags.join(', ')}`);
        }
        if (result.manifest.license) {
          console.log(`  License: ${result.manifest.license}`);
        }
      }
      
    } catch (err) {
      console.error('❌ Validation failed:', err.message);
      process.exit(1);
    }
  });