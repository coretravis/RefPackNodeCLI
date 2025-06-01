# RefPack CLI

```
██████╗ ███████╗███████╗██████╗  █████╗  ██████╗██╗  ██╗
██╔══██╗██╔════╝██╔════╝██╔══██╗██╔══██╗██╔════╝██║ ██╔╝
██████╔╝█████╗  █████╗  ██████╔╝███████║██║     █████╔╝ 
██╔══██╗██╔══╝  ██╔══╝  ██╔═══╝ ██╔══██║██║     ██╔═██╗ 
██║  ██║███████╗██║     ██║     ██║  ██║╚██████╗██║  ██╗
╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝     ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝
```

**Streamline your dataset workflow with powerful packaging, validation, and registry management tools.**

RefPack is a command-line tool for creating, validating, and managing dataset packages with cryptographic signatures and schema validation. It provides a complete workflow for packaging datasets with metadata, distributing them through registries, and ensuring data integrity.

## Features

- 📦 **Package Creation**: Bundle datasets with metadata, schemas, and assets
- ✅ **Validation**: Verify package integrity and cryptographic signatures  
- 🔐 **Cryptographic Signing**: Secure packages with JWS (JSON Web Signatures)
- 📋 **Schema Validation**: Ensure data consistency with JSON Schema
- 🌐 **Registry Integration**: Push and pull packages from remote registries
- 🏗️ **Scaffolding**: Quick-start new projects with template generation
- 📚 **Rich Metadata**: Include changelogs, documentation, and supplemental assets

## Installation

```bash
npm install -g refpack
```

Or run directly with npx:

```bash
npx refpack <command>
```

## Quick Start

### 1. Create a New RefPack Project

```bash
refpack scaffold --output my-dataset --id my-data --title "My Dataset" --author "Your Name"
```

This creates a new folder with all the required files:
- `data.meta.json` - Package metadata
- `data.json` - Your dataset
- `data.schema.json` - JSON Schema for validation
- `data.changelog.json` - Version history
- `data.readme.md` - Documentation
- `sign-key.pem` - Private signing key
- `key-id.txt` - Key identifier
- `assets/` - Supplemental files

### 2. Package Your Dataset

```bash
refpack pack \
  --input ./my-dataset \
  --output my-data-1.0.0.refpack.zip \
  --sign-key ./my-dataset/sign-key.pem \
  --key-id $(cat ./my-dataset/key-id.txt)
```

### 3. Validate the Package

```bash
refpack validate --package my-data-1.0.0.refpack.zip --verbose
```

### 4. Push to Registry

```bash
refpack push \
  --package my-data-1.0.0.refpack.zip \
  --api-url https://registry.example.com \
  --api-key your-api-key
```

### 5. Pull from Registry

```bash
refpack pull \
  --id my-data \
  --version 1.0.0 \
  --dest ./downloaded-data \
  --api-url https://registry.example.com
```

## Commands

### `scaffold`
Create a new RefPack project with all required files.

```bash
refpack scaffold --output <folder> [options]
```

**Options:**
- `--output <folder>` - Output directory (required)
- `--id <id>` - Package identifier
- `--title <title>` - Package title
- `--author <author>` - Author name

### `pack`
Create a signed RefPack ZIP file from a project folder.

```bash
refpack pack --input <folder> --output <file> --sign-key <pem> --key-id <kid>
```

**Options:**
- `--input <folder>` - Source folder to package (required)
- `--output <file>` - Output ZIP file path (required)
- `--sign-key <pem>` - Private key PEM file for signing (required)
- `--key-id <kid>` - Key identifier for JWS header (required)

### `validate`
Verify a RefPack ZIP file's structure, schema, and signature.

```bash
refpack validate --package <file> [options]
```

**Options:**
- `--package <file>` - RefPack ZIP file to validate (required)
- `--verbose` - Show detailed validation information

### `push`
Upload a RefPack to a remote registry.

```bash
refpack push --package <file> --api-url <url> --api-key <key>
```

**Options:**
- `--package <file>` - RefPack ZIP file to upload (required)
- `--api-url <url>` - Registry API URL (required)
- `--api-key <key>` - Authentication key (required)

### `pull`
Download a RefPack from a remote registry.

```bash
refpack pull --id <id> --version <version> --dest <folder> [options]
```

**Options:**
- `--id <id>` - Package identifier (required)
- `--version <version>` - Package version (required)
- `--dest <folder>` - Destination folder or ZIP file (required)
- `--api-url <url>` - Registry API URL

### `meta`
Fetch and display package metadata from a registry.

```bash
refpack meta --id <id> --version <version> [options]
```

**Options:**
- `--id <id>` - Package identifier (required)
- `--version <version>` - Package version (required)
- `--api-url <url>` - Registry API URL

## RefPack Structure

A RefPack contains these components:

### Required Files
- **`data.meta.json`** - Package metadata (id, version, title, authors, etc.)
- **`data.json`** - The actual dataset in JSON format
- **`manifest.json`** - Cryptographically signed manifest (auto-generated)

### Optional Files
- **`data.schema.json`** - JSON Schema for data validation
- **`data.changelog.json`** - Version history and release notes
- **`data.readme.md`** - Documentation and usage instructions
- **`assets/`** - Directory for supplemental files (images, docs, etc.)

### Example `data.meta.json`
```json
{
  "id": "world-countries",
  "version": "2.1.0",
  "title": "World Countries Dataset",
  "nameField": "name",
  "idField": "code",
  "description": "Comprehensive dataset of world countries with population data",
  "authors": ["Data Team"],
  "createdUtc": "2024-01-15T10:30:00Z",
  "tags": ["geography", "countries", "population"],
  "license": "MIT"
}
```

## Security

RefPack uses **ES256** (ECDSA with P-256 curve and SHA-256) for cryptographic signatures:

- Each package is signed with a private key
- Signatures are embedded in the `manifest.json` as JWS
- Validation verifies both data integrity and authenticity
- Keys are generated automatically during scaffolding

## Registry API

RefPack works with HTTP-based registries that implement these endpoints:

- `POST /packages` - Upload package
- `GET /packages/{id}?version={v}` - Download package
- `GET /packages/{id}/meta?version={v}` - Get metadata

## Examples

### Working with Geographic Data
```bash
# Create a new geographic dataset
refpack scaffold --output countries-data --id world-countries --title "World Countries"

# Edit your data.json with country information
# Add a schema to validate country codes and names
# Package with signature
refpack pack --input countries-data --output countries-v1.refpack.zip \
  --sign-key countries-data/sign-key.pem --key-id $(cat countries-data/key-id.txt)

# Validate before distribution
refpack validate --package countries-v1.refpack.zip --verbose
```

### Registry Workflow
```bash
# Push to development registry
refpack push --package my-data-1.0.0.refpack.zip \
  --api-url https://dev-registry.company.com \
  --api-key $DEV_API_KEY

# Later, pull on another machine
refpack pull --id my-data --version 1.0.0 \
  --dest ./local-copy \
  --api-url https://dev-registry.company.com
```

## Requirements

- Node.js 14.0 or higher
- npm or yarn package manager

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions:
- Open an issue on GitHub
- Check the documentation wiki
- Join our community discussions