import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import Ajv from 'ajv';
import { SignJWT } from 'jose';
import draft2020MetaSchema from '../../json-schema-2020-12.json' assert { type: 'json' };

// Helper: Read JSON file
function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// Helper: Validate manifest against schema
function validateManifestSchema(manifest, schema) {
  const ajv = new Ajv({ strict: false, loadSchema: undefined, meta: false });
  ajv.addMetaSchema(draft2020MetaSchema);
  const validate = ajv.compile(schema);
  if (!validate(manifest)) {
    throw new Error('Manifest schema validation failed: ' + JSON.stringify(validate.errors));
  }
}

// Helper: Sign manifest
async function signManifest(manifestPath, keyPem, kid) {
  const manifestBytes = fs.readFileSync(manifestPath);
  const privateKey = await import('jose').then(jose => jose.importPKCS8(fs.readFileSync(keyPem, 'utf8'), 'ES256'));

   // Export the public key portion from the private key as JWK
  const jwk = await import('jose').then(jose => jose.exportJWK(privateKey));
 // Remove private key components, keep only public key parts
  delete jwk.d; // Remove private key component
  delete jwk.key_ops; // Remove key operations if present
  jwk.use = 'sig'; // Mark as signing key
  jwk.key_ops = ['verify']; // Only allow verification operations

  const jws = await new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid, jwk: jwk })
    .setIssuedAt()
    .setJti('refpack')
    .setExpirationTime('2h')
    .sign(privateKey, manifestBytes);
  return jws;
}

export async function createRefPackZip(inputFolder, outputZip, signKey, keyId) {
  // Validate file layout
  const required = ['data.meta.json', 'data.json'];
  for (const file of required) {
    if (!fs.existsSync(path.join(inputFolder, file))) {
      throw new Error(`Missing required file: ${file}`);
    }
  }
  // Validate manifest schema
  const manifest = readJson(path.join(inputFolder, 'data.meta.json'));
  // Use schema from project root (relative to process.cwd())
  const schemaPath = path.resolve(process.cwd(), 'data.meta.schema.json');
  const schema = readJson(schemaPath);
  validateManifestSchema(manifest, schema);
  // Sign manifest
  const jws = await signManifest(path.join(inputFolder, 'data.meta.json'), signKey, keyId);
  fs.writeFileSync(path.join(inputFolder, 'data.meta.json.jws'), jws);
  // Create ZIP
  const zip = new AdmZip();
for (const file of fs.readdirSync(inputFolder)) {
  if (file === '.' || file === '..') continue;
  if (file === 'sign-key.pem' || file === 'key-id.txt' || file === 'public-key.pem') continue; // Exclude secrets
  const filePath = path.join(inputFolder, file);
  if (fs.statSync(filePath).isFile()) {
    zip.addLocalFile(filePath, '', file);
  } else if (file === 'assets') {
    zip.addLocalFolder(filePath, 'assets');
  }
}
  zip.writeZip(outputZip);
}
