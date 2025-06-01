# RefPack CLI Usage Guide

This guide provides detailed examples for using the RefPack CLI to create, validate, push, pull, and inspect dataset packages according to the RefPack specification.

---

## 1. Scaffold a New RefPack

Create a new RefPack folder with all required files, a signing key, and a key ID:

```bash
node refpack.js scaffold --output ./my-refpack --id myid --title "My Dataset" --author "Your Name"
```
- This creates the folder `my-refpack/` with:
  - `data.meta.json`, `data.json`, `data.schema.json`, `data.changelog.json`, `data.readme.md`, and `assets/`
  - `sign-key.pem` (private key for signing)
  - `key-id.txt` (key identifier)

---

## 2. Pack & Sign a RefPack

Package and sign the dataset folder into a distributable ZIP file:

```bash
node refpack.js pack \
  --input ./my-refpack/ \
  --output myid-1.0.0.refpack.zip \
  --sign-key ./my-refpack/sign-key.pem \
  --key-id $(cat ./my-refpack/key-id.txt)
```
- Validates the folder structure and manifest.
- Signs `data.meta.json` and creates `data.meta.json.jws`.
- Produces `myid-1.0.0.refpack.zip`.

---

## 3. Validate a RefPack ZIP

Verify the structure, schemas, and JWS signature of a package:

```bash
node refpack.js validate \
  --package myid-1.0.0.refpack.zip \
  --jwks https://keys.example.com/.well-known/jwks.json
```
- Checks ZIP layout, manifest schema, and signature.

---

## 4. Push to a Registry

Upload a package to a remote registry:

```bash
node refpack.js push \
  --package myid-1.0.0.refpack.zip \
  --api-url https://api.refpack.example.com \
  --api-key $REFPACK_TOKEN
```
- Expects a JSON response `{ "success": true }`.

---

## 5. Pull a Package from Registry

Download a package ZIP from a registry:

```bash
node refpack.js pull \
  --id myid \
  --version 1.0.0 \
  --dest ./downloads/myid-1.0.0.refpack.zip \
  --api-url https://api.refpack.example.com
```

---

## 6. Inspect Package Metadata

Fetch and print the manifest for a package version:

```bash
node refpack.js meta \
  --id myid \
  --version 1.0.0 \
  --api-url https://api.refpack.example.com
```

---

## 7. Example Workflow

```bash
# Scaffold a new package
node refpack.js scaffold --output ./country-data --id country --title "Country Dataset" --author "Data Team"

# Pack and sign
node refpack.js pack \
  --input ./country-data/ \
  --output country-1.0.0.refpack.zip \
  --sign-key ./country-data/sign-key.pem \
  --key-id $(cat ./country-data/key-id.txt)

# Validate
node refpack.js validate \
  --package country-1.0.0.refpack.zip \
  --jwks https://keys.example.com/.well-known/jwks.json

# Push
node refpack.js push \
  --package country-1.0.0.refpack.zip \
  --api-url https://api.refpack.example.com \
  --api-key $REFPACK_TOKEN

# Pull
node refpack.js pull --id country --version 1.0.0 --dest ./downloads/country-1.0.0.refpack.zip --api-url https://api.refpack.example.com

# Inspect metadata
node refpack.js meta --id country --version 1.0.0 --api-url https://api.refpack.example.com
```

---

## Notes
- All commands can be run with `node refpack.js ...` or, if installed globally, with `refpack ...`.
- On Windows, use `type` instead of `cat` to read files: `type .\my-refpack\key-id.txt`.
- The `scaffold` command generates a signing key and key ID for you.
- Always validate before pushing to a registry.
