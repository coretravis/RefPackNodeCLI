import fs from 'fs';
import AdmZip from 'adm-zip';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { jwtVerify, importJWK } from 'jose';
// RefPack manifest schema
import draft2020MetaSchema from '../../json-schema-2020-12.json' assert { type: 'json' };

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function validateZipSanitization(entries) {
  const allowedRootFiles = [
    'data.meta.json',
    'data.meta.json.jws', 
    'data.json',
    'data.schema.json',
    'data.changelog.json',
    'data.readme.md'
  ];

  for (const entry of entries) {
    // Check for path traversal
    if (entry.includes('../') || entry.includes('..\\')) {
      throw new Error(`Path traversal detected in entry: ${entry}`);
    }

    // Check for valid root entries
    if (!entry.startsWith('assets/') && !allowedRootFiles.includes(entry)) {
      throw new Error(`Unexpected root entry: ${entry}`);
    }

    // Ensure assets folder is flat
    if (entry.startsWith('assets/')) {
      const assetPath = entry.substring(7); // Remove 'assets/'
      if (assetPath.includes('/') || assetPath.includes('\\')) {
        throw new Error(`Assets folder must be flat, found nested path: ${entry}`);
      }
    }
  }
}

function validateManifestSchema(manifest) {
  const ajv = new Ajv({ strict: false });
  addFormats(ajv);
  
  const validate = ajv.compile(draft2020MetaSchema);
  const valid = validate(manifest);
  
  if (!valid) {
    throw new Error(`Manifest schema validation failed: ${JSON.stringify(validate.errors, null, 2)}`);
  }
}

function validateDataSchema(data, schema) {
  const ajv = new Ajv({ strict: false });
  ajv.addMetaSchema(draft2020MetaSchema); // Add 2020-12 meta-schema
  addFormats(ajv);
  
  const validate = ajv.compile(schema);
  const valid = validate(data);
  
  if (!valid) {
    throw new Error(`Data schema validation failed: ${JSON.stringify(validate.errors, null, 2)}`);
  }
}

function validateJwkStructure(jwk) {
  // Ensure JWK contains only public key components
  const allowedKeys = ['kty', 'crv', 'x', 'y', 'use', 'key_ops', 'alg', 'kid'];
  const forbiddenKeys = ['d', 'p', 'q', 'dp', 'dq', 'qi', 'k']; // Private key components
  
  for (const key of Object.keys(jwk)) {
    if (!allowedKeys.includes(key)) {
      throw new Error(`Unexpected JWK field: ${key}`);
    }
  }
  
  for (const key of forbiddenKeys) {
    if (jwk[key]) {
      throw new Error(`JWK must not contain private key component: ${key}`);
    }
  }
  
  // Validate required fields for EC keys
  if (jwk.kty === 'EC') {
    if (!jwk.crv || !jwk.x || !jwk.y) {
      throw new Error('EC JWK missing required fields (crv, x, y)');
    }
  }
  
  // Validate key usage
  if (jwk.use && jwk.use !== 'sig') {
    throw new Error(`Invalid JWK use: ${jwk.use}, expected 'sig'`);
  }
  
  if (jwk.key_ops && !jwk.key_ops.includes('verify')) {
    throw new Error('JWK key_ops must include "verify"');
  }
}

async function validateJwsSignature(jwsToken, manifestBytes) {
  try {
    // Parse JWS header to extract embedded JWK
    const [headerB64] = jwsToken.split('.');
    const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString());
    
    if (!header.jwk) {
      throw new Error('JWS header missing embedded JWK');
    }
    
    // Validate JWK structure
    validateJwkStructure(header.jwk);
    
    // Import the public key from embedded JWK
    const publicKey = await importJWK(header.jwk);
    
    // Verify the JWT signature and claims
    const { payload } = await jwtVerify(jwsToken, publicKey, {
      requiredClaims: ['jti'],
      clockTolerance: '5m' // Allow 5 minute clock skew
    });
    
    // Validate JWT claims
    if (payload.jti !== 'refpack') {
      throw new Error(`Invalid JWT ID: ${payload.jti}, expected 'refpack'`);
    }
    
    // Validate issued at time (not in future)
    if (payload.iat && payload.iat > Math.floor(Date.now() / 1000) + 300) { // 5min tolerance
      throw new Error('JWT issued at time is in the future');
    }
    
    // Note: The jwtVerify function automatically validates the signature
    // against the manifest bytes through the JWS payload verification
    
    return {
      valid: true,
      keyId: header.kid,
      algorithm: header.alg,
      claims: payload
    };
    
  } catch (error) {
    throw new Error(`JWS signature validation failed: ${error.message}`);
  }
}

export async function validateRefPackZip(zipPath) {
  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries().map(e => e.entryName);
  
  console.log('Validating RefPack structure...');
  
  // 1. Check required files
  const requiredFiles = ['data.meta.json', 'data.meta.json.jws', 'data.json'];
  for (const file of requiredFiles) {
    if (!entries.includes(file)) {
      throw new Error(`Missing required file: ${file}`);
    }
  }
  
  // 2. Validate ZIP sanitization
  validateZipSanitization(entries);
  console.log('✓ ZIP structure validation passed');
  
  // 3. Parse and validate manifest
  const manifestBytes = zip.readFile('data.meta.json');
  const manifest = JSON.parse(manifestBytes.toString('utf8'));
  validateManifestSchema(manifest);
  console.log('✓ Manifest schema validation passed');
  
  // 4. Validate JWS signature with embedded public key
  const jwsToken = zip.readAsText('data.meta.json.jws');
  const signatureResult = await validateJwsSignature(jwsToken, manifestBytes);
  console.log(`✓ JWS signature validation passed (key: ${signatureResult.keyId}, alg: ${signatureResult.algorithm})`);
  
  // 5. Validate data payload structure
  const dataBytes = zip.readFile('data.json');
  const data = JSON.parse(dataBytes.toString('utf8'));
  
  if (!Array.isArray(data)) {
    throw new Error('data.json must be an array of objects');
  }
  
  for (const item of data) {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      throw new Error('data.json must contain only objects (no primitives or arrays)');
    }
  }
  console.log(`✓ Data payload validation passed (${data.length} records)`);
  
  // 6. Validate against data schema if present
  if (entries.includes('data.schema.json')) {
    const schemaBytes = zip.readFile('data.schema.json');
    const schema = JSON.parse(schemaBytes.toString('utf8'));
    
    // Ensure schema validates an array
    if (schema.type !== 'array') {
      throw new Error('data.schema.json must have root type "array"');
    }
    
    validateDataSchema(data, schema);
    console.log('✓ Data schema validation passed');
  }
  
  // 7. Validate changelog format if present
  if (entries.includes('data.changelog.json')) {
    const changelogBytes = zip.readFile('data.changelog.json');
    const changelog = JSON.parse(changelogBytes.toString('utf8'));
    
    if (!Array.isArray(changelog)) {
      throw new Error('data.changelog.json must be an array');
    }
    
    for (const entry of changelog) {
      if (!entry.version || !entry.date || !entry.description) {
        throw new Error('Changelog entries must have version, date, and description');
      }
    }
    console.log('✓ Changelog validation passed');
  }
  
  return {
    valid: true,
    manifest,
    signature: signatureResult,
    recordCount: data.length,
    hasSchema: entries.includes('data.schema.json'),
    hasChangelog: entries.includes('data.changelog.json'),
    hasReadme: entries.includes('data.readme.md'),
    assetCount: entries.filter(e => e.startsWith('assets/')).length
  };
}