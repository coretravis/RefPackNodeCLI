import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { generateKeyPair, exportPKCS8, exportSPKI } from 'jose';

export const scaffoldCommand = new Command('scaffold')
  .description('Scaffold a new RefPack folder with required files')
  .requiredOption('--output <folder>', 'Output folder to create')
  .option('--id <id>', 'Package id')
  .option('--title <title>', 'Package title')
  .option('--author <author>', 'Author name')
  .action(async (opts) => {
    const outDir = opts.output;
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    // data.meta.json
    const meta = {
      id: opts.id || 'example',
      version: '1.0.0',
      title: opts.title || 'Example RefPack',
      nameField:"",
      idField:"",
      description: '',
      authors: opts.author ? [opts.author] : [],
      createdUtc: new Date().toISOString(),
      tags: [],
      license: ''
    };
    fs.writeFileSync(path.join(outDir, 'data.meta.json'), JSON.stringify(meta, null, 2));
    // data.json
    fs.writeFileSync(path.join(outDir, 'data.json'), '[\n  { "id": "US", "name": "United States", "population": 331002651 }\n]');
    // data.schema.json
    fs.writeFileSync(path.join(outDir, 'data.schema.json'), JSON.stringify({
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      "title": "RefPack Data Schema",
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "population": { "type": "integer", "minimum": 0 }
        },
        "required": ["id", "name", "population"],
        "additionalProperties": false
      }
    }, null, 2));
    // data.changelog.json
    fs.writeFileSync(path.join(outDir, 'data.changelog.json'), '[\n  { "version": "1.0.0", "date": "'+new Date().toISOString().slice(0,10)+'", "description": "Initial release" }\n]');
    // data.readme.md
    fs.writeFileSync(path.join(outDir, 'data.readme.md'), '# RefPack\n\nDescribe your dataset here.');
    // assets/
    const assetsDir = path.join(outDir, 'assets');
    if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir);
    fs.writeFileSync(path.join(assetsDir, 'example.txt'), 'Supplemental asset file.');
    // Generate sign-key and key-id
    const { privateKey, publicKey } = await generateKeyPair('ES256');
    const pkcs8 = await exportPKCS8(privateKey);
    const spki = await exportSPKI(publicKey); // Export public key
    const pem = pkcs8;
    const signKeyPath = path.join(outDir, 'sign-key.pem');
    fs.writeFileSync(signKeyPath, pem);

    // Also save the public key
    const publicKeyPath = path.join(outDir, 'public-key.pem');
    fs.writeFileSync(publicKeyPath, spki);

    // Key ID: use a date-based or random string
    const keyId = `key-${new Date().toISOString().slice(0,10)}`;
    fs.writeFileSync(path.join(outDir, 'key-id.txt'), keyId);
    console.log('RefPack scaffold created at', outDir);
    console.log('Private key (sign-key.pem) and key-id.txt generated.');
  });
