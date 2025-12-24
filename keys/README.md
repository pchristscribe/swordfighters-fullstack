# PGP Keys for Environment File Encryption

This directory contains PGP public keys used for encrypting sensitive environment files (`.env`) in the project.

## Public Key

**File:** `pgp-public.asc`
**Owner:** P. Christopher Schreiber
**Key ID:** 2E8DCF0B
**Purpose:** Encrypting `.env` files for secure sharing and version control

## Usage

### Encrypting Environment Files

```bash
# Encrypt .env file
gpg --encrypt --recipient 2E8DCF0B --armor --output .env.gpg .env

# Add encrypted file to git
git add .env.gpg
```

### Decrypting Environment Files

```bash
# Decrypt .env.gpg (requires private key)
gpg --decrypt .env.gpg > .env
```

### Importing the Public Key

```bash
# Import this public key to your GPG keyring
gpg --import keys/pgp-public.asc
```

## Security Notes

- ✅ **Public keys are safe to commit** - they can only encrypt, not decrypt
- ❌ **Never commit private keys** - keep them secure locally
- ❌ **Never commit unencrypted .env files** - use `.gitignore`
- ✅ **Do commit encrypted .env.gpg files** - safe to share

## Related Documentation

See [ADMIN_PANEL_SETUP.md](../ADMIN_PANEL_SETUP.md) for environment variable configuration.
