## 1. Overview

A **RefPack** is a ZIP-based bundle containing:

* A mandatory, signed JSON manifest (`data.meta.json`)
* A mandatory payload (`data.json`, always an array of objects)
* Optional schema, changelog, readme, and static assets
* Cryptographic guarantees (via JWS with embedded public key) over the manifest

Clients and servers share this spec as the single source of truth for packing, pushing, pulling, validating, and consuming datasets.

---

## 2. File Layout

```
/                             ← Package root (no nested folders, except `assets/`)
├── data.meta.json            ← REQUIRED, signed manifest
├── data.meta.json.jws        ← REQUIRED, JWS signature over exact `data.meta.json` bytes
├── data.json                 ← REQUIRED, JSON array of objects
├── data.schema.json          ← OPTIONAL, JSON-Schema for `data.json`
├── data.changelog.json       ← OPTIONAL, versioned changelog
├── data.readme.md            ← OPTIONAL, human-readable documentation
└── assets/                   ← OPTIONAL, flat folder of supplemental files
    ├── image.png
    └── lookup.csv
```

* **Root** must contain only the six listed entries (plus any files under `assets/`).
* No `../` or arbitrary subfolders beyond `assets/`.
* ZIP entries must be "sanitized" (clients must reject entries with path traversal or unexpected roots).

---

## 3. Manifest: `data.meta.json`

### 3.1 JSON-Schema

```jsonc
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "RefPack DatasetMeta",
  "type": "object",
  "required": ["id","version","title","createdUtc"],
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^[A-Za-z0-9](?:[A-Za-z0-9_-]*[A-Za-z0-9])?$",
      "description": "Package identifier (alphanumeric, -, _, no spaces)."
    },
    "version": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+\\.\\d+(?:-[0-9A-Za-z\\.]+)?$",
      "description": "SemVer 2.0.0 version string."
    },
    "title": {
      "type": "string",
      "minLength": 1,
      "description": "Human-readable title."
    },
    "description": {
      "type": "string",
      "description": "Optional long description."
    },
    "authors": {
      "type": "array",
      "items": { "type": "string" },
      "description": "List of author names or organizations."
    },
    "createdUtc": {
      "type": "string",
      "format": "date-time",
      "description": "UTC timestamp of package creation."
    },
    "tags": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Free-form tags."
    },
    "license": {
      "type": "string",
      "description": "SPDX license identifier."
    }
  },
  "additionalProperties": false
}
```

### 3.2 Signing with JWS (Self-Contained Approach)

* **File:** `data.meta.json.jws`
* **Format:** Compact JWS (RFC 7515) with embedded public key
* **Payload:** Exact bytes of `data.meta.json`

#### 3.2.1 JWS Header Structure

The JWS header must contain an **embedded JSON Web Key (JWK)** with the public key:

```jsonc
{
  "alg": "ES256",           // Algorithm (ES256 recommended)
  "kid": "publisher-key-1", // Key identifier
  "jwk": {                  // Embedded public key (JWK format)
    "kty": "EC",
    "crv": "P-256",
    "x": "...",             // Public key X coordinate
    "y": "...",             // Public key Y coordinate
    "use": "sig",           // Key usage: signing
    "key_ops": ["verify"]   // Allowed operations: verification only
  },
  "typ": "JWT"              // Token type
}
```

#### 3.2.2 JWS Claims (Payload)

The JWS contains standard JWT claims for security:

```jsonc
{
  "iat": 1640995200,        // Issued at (Unix timestamp)
  "exp": 1641002400,        // Expiration time (Unix timestamp, typically 2 hours)
  "jti": "refpack"          // JWT ID (must be "refpack")
}
```

#### 3.2.3 Validation Process

**Clients and servers must**:

1. **Parse JWS header** and extract the embedded `jwk` field
2. **Validate JWK structure** ensuring it contains only public key components
3. **Verify signature** using the embedded public key over `BASE64URL(header) . BASE64URL(payload)`
4. **Validate JWT claims**:
   - Check `exp` (expiration) if present
   - Verify `iat` (issued at) is not in the future (allow 5min clock skew)
   - Ensure `jti` equals "refpack"
5. **Verify manifest integrity**: Ensure the JWS was signed over the exact bytes of `data.meta.json`

#### 3.2.4 Security Benefits

This self-contained approach provides:

* **No network dependencies** for key retrieval
* **Package authenticity** through cryptographic signatures  
* **Key rotation flexibility** (each package can use different keys)
* **Decentralized trust model** (no central key authority required)
* **Offline validation** capability

---

## 4. Payload: `data.json`

Must be a JSON array of objects. No top-level object.

### 4.1 Example

```json
[
  { "id": "US", "name": "United States", "population": 331002651 },
  { "id": "CA", "name": "Canada",        "population": 37742154  }
]
```

---

## 5. Schema: `data.schema.json` (Optional)

When present, **must validate an array of objects** to match `data.json`.

```jsonc
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "RefPack Data Schema",
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "id":        { "type": "string" },
      "name":      { "type": "string" },
      "population":{ "type": "integer", "minimum": 0 }
    },
    "required": ["id","name","population"],
    "additionalProperties": false
  }
}
```

* **Root** `type: "array"` guarantees payload shape.
* Clients **must** validate `data.json` against this schema when present.

---

## 6. Changelog & Readme (Optional)

* **`data.changelog.json`**: Array of version entries

  ```json
  [
    { "version": "1.0.0", "date": "2024-12-01", "description": "Initial release" },
    { "version": "1.1.0", "date": "2025-02-15", "description": "Added fields" }
  ]
  ```
* **`data.readme.md`**: Markdown file for human-oriented notes.

---

## 7. Assets Folder (Optional)

* **`assets/`**: Flat directory of supplemental files (images, CSVs, etc.).
* Clients preserve the entire folder; do not interpret its contents.

---

## 8. Versioning

1. **SemVer 2.0.0** required.
2. New version **must** be strictly greater than any published under the same `id`.
3. Clients may reject pre-releases unless invoked with `--allow-prerelease`.

---

## 9. Security & Validation

* **ZIP sanitization**: Reject any entry with path traversal (`../`) or unexpected root paths.
* **Manifest schema**: Enforce JSON-Schema on `data.meta.json`.
* **Payload schema**: Validate `data.json` against `data.schema.json` if present.
* **JWS signature**: Enforce JWS verification with embedded public key on every manifest.
* **Key security**: Embedded JWK must contain only public key components (no private key material).

---

## 10. Packaging & CLI Conventions

A canonical CLI (e.g. `refpack`) typically implements:

| Command    | Description                                                     |
| ---------- | --------------------------------------------------------------- |
| `pack`     | Validate folder, then create `<id>-<version>.refpack.zip`       |
| `validate` | Open a `.refpack.zip`, verify layout, schemas, and JWS.         |
| `push`     | `POST` ZIP to `/packages`, expect JSON `{"success":true}`.      |
| `pull`     | `GET /packages/{id}?version={v}`, saves ZIP or extracts folder. |
| `meta`     | `GET /packages/{id}/meta?version={v}`, prints JSON manifest.    |

### 10.1 Example

```bash
# 1. Pack & sign locally with private key
refpack pack \
  --input ./country-data/ \
  --output country-1.0.0.refpack.zip \
  --sign-key ~/.keys/publisher.pem \
  --key-id publisher-2025-05-20

# 2. Validate (uses embedded public key)
refpack validate \
  --package country-1.0.0.refpack.zip \
  --verbose

# 3. Push to registry
refpack push \
  --package country-1.0.0.refpack.zip \
  --api-url https://api.refpack.example.com \
  --api-key $REFPACK_TOKEN

# 4. Later, pull & inspect
refpack pull --id country --version 1.0.0 --dest ./downloads/
refpack meta --id country --version 1.0.0
```

---

## 11. Key Management Best Practices

### 11.1 Private Key Security
* Store private keys securely (HSMs, encrypted files, secure key stores)
* Use different keys for different publishers/organizations
* Implement key rotation policies
* Never embed private keys in packages or version control

### 11.2 Public Key Distribution
* Public keys are automatically distributed via the embedded JWK in each package
* No separate key distribution infrastructure needed
* Keys are self-validating through cryptographic signatures

### 11.3 Trust Model
* Trust is established through out-of-band verification of the first package from a publisher
* Subsequent packages from the same `kid` (Key ID) maintain trust chain
* Publishers can rotate keys by using new `kid` values

---

## 12. Extensibility

* **Additional metadata**: Clients may add custom fields under a vendor extension namespace (e.g. `"x-my-field": ...`).
* **Alternate signing algorithms**: Support multiple JWS algorithms (ES256, ES384, ES512, EdDSA).
* **Multiple signatures**: Future versions may support multiple JWS signatures for multi-party signing.
* **Streaming**: For very large packages, clients may implement chunked uploads but must reassemble a valid zip before validation.
* **Event Hooks**: Define optional hooks (e.g. `pre-pack`, `post-pull`) in a `refpack.config.json` for custom workflows.