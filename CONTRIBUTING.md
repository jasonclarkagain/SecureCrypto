# Contributing to PGP Crypter

Thank you for your interest in contributing to PGP Crypter! This document provides guidelines for contributing to this ultra-secure encryption platform.

## 🛡️ Security First

This project implements military-grade encryption designed to resist nation-state attacks. All contributions must maintain the highest security standards.

### Security Guidelines

1. **Never Log Sensitive Data**: Private keys, passphrases, or decrypted content must never be logged
2. **Client-Side Only**: All cryptographic operations must remain client-side
3. **No Backdoors**: Absolutely no backdoors, debugging hooks, or security bypasses
4. **Secure Defaults**: Always use the most secure settings as defaults
5. **Input Validation**: All user inputs must be validated and sanitized

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or 20+
- PostgreSQL database
- Git
- Basic understanding of cryptography concepts

### Development Setup

1. **Fork the repository**
   ```bash
   git fork https://github.com/yourusername/pgp-crypter.git
   cd pgp-crypter
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Set up database**
   ```bash
   npm run db:push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 📝 Contribution Types

### Bug Fixes
- Security vulnerabilities (report privately first)
- UI/UX improvements
- Performance optimizations
- Browser compatibility issues

### Feature Additions
- New cryptographic features
- Additional security audit tools
- Enhanced key management
- Improved user experience

### Documentation
- Code documentation
- User guides
- Security best practices
- API documentation

## 🔒 Security Vulnerability Reporting

**DO NOT** open public issues for security vulnerabilities.

### Responsible Disclosure Process

1. **Email**: Send details to [security@yourproject.com]
2. **Include**: 
   - Detailed description
   - Steps to reproduce
   - Potential impact
   - Suggested fixes (if any)
3. **Wait**: Allow 90 days for fixes before public disclosure
4. **Coordinate**: Work with maintainers on disclosure timeline

### Security Severity Levels

- **Critical**: Remote code execution, private key exposure
- **High**: Authentication bypass, encryption weakness
- **Medium**: Information disclosure, denial of service
- **Low**: Minor security improvements

## 📋 Development Guidelines

### Code Style

- **TypeScript**: Use strict TypeScript for all code
- **ESLint**: Follow project ESLint configuration
- **Prettier**: Format code with Prettier
- **Comments**: Document complex cryptographic operations

### Commit Messages

Follow conventional commit format:
```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New features
- `fix`: Bug fixes
- `security`: Security improvements
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions/modifications

Examples:
```bash
git commit -m "feat(crypto): add quantum-resistant key generation"
git commit -m "security(auth): fix session token validation"
git commit -m "docs(api): update encryption endpoint documentation"
```

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `security/description` - Security improvements
- `docs/description` - Documentation updates

### Testing Requirements

- **Unit Tests**: Test all cryptographic functions
- **Integration Tests**: Test end-to-end encryption flows
- **Security Tests**: Verify no sensitive data leaks
- **Browser Tests**: Test across supported browsers

## 🔍 Code Review Process

### Review Criteria

1. **Security**: No vulnerabilities or weak implementations
2. **Functionality**: Code works as intended
3. **Performance**: No significant performance degradation
4. **Style**: Follows project coding standards
5. **Documentation**: Adequate comments and documentation

### Security Review

All cryptographic changes require additional security review:
- Cryptographic algorithm implementation
- Key generation and management
- Encryption/decryption operations
- Random number generation
- Secure deletion implementations

## 📦 Pull Request Process

### Before Submitting

1. **Test Thoroughly**: Run all tests and manual testing
2. **Security Check**: Verify no sensitive data exposure
3. **Documentation**: Update relevant documentation
4. **Changelog**: Add entry to CHANGELOG.md if applicable

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Security improvement
- [ ] Documentation update
- [ ] Performance improvement

## Security Impact
- [ ] No security impact
- [ ] Improves security
- [ ] Requires security review

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Browser compatibility tested

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No sensitive data in logs
```

### Review Process

1. **Automated Checks**: CI/CD pipeline must pass
2. **Code Review**: At least one maintainer review
3. **Security Review**: Required for crypto-related changes
4. **Testing**: Manual testing in multiple browsers
5. **Documentation**: Verify documentation is updated

## 🏗️ Architecture Guidelines

### Frontend (React)

- **Components**: Use functional components with hooks
- **State Management**: Use React hooks and context
- **Styling**: Use Tailwind CSS with shadcn/ui components
- **Routing**: Use Wouter for client-side routing
- **Crypto**: Use OpenPGP.js for all cryptographic operations

### Backend (Node.js)

- **API**: RESTful endpoints with Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Validation**: Zod schemas for all inputs
- **Authentication**: Session-based authentication
- **Storage**: No sensitive data on server

### Security Architecture

- **Client-Side Crypto**: All encryption happens in browser
- **Zero Knowledge**: Server never sees private keys
- **Local Storage**: Keys stored in browser localStorage
- **Secure Transport**: HTTPS for all communications
- **Input Validation**: Server-side validation for all inputs

## 🧪 Testing Guidelines

### Unit Tests

```javascript
// Example crypto test
describe('PGP Key Generation', () => {
  test('generates secure 4096-bit RSA key', async () => {
    const keyPair = await PGPService.generateKeyPair(
      'Test User', 
      'test@example.com', 
      'secure-passphrase',
      4096
    );
    
    expect(keyPair.keyInfo.keySize).toBe(4096);
    expect(keyPair.publicKey).toContain('BEGIN PGP PUBLIC KEY');
    expect(keyPair.privateKey).toContain('BEGIN PGP PRIVATE KEY');
  });
});
```

### Security Tests

```javascript
// Example security test
describe('Security Validation', () => {
  test('private key never sent to server', async () => {
    const mockFetch = jest.spyOn(global, 'fetch');
    
    await encryptMessage('test message', publicKey);
    
    // Verify no fetch calls contain private key data
    expect(mockFetch).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        body: expect.stringContaining('BEGIN PGP PRIVATE KEY')
      })
    );
  });
});
```

## 📚 Documentation Standards

### Code Documentation

```typescript
/**
 * Generates a military-grade PGP key pair with specified parameters
 * 
 * @param name - Full name for key identity
 * @param email - Email address for key identity  
 * @param passphrase - Strong passphrase for private key protection
 * @param keySize - Key size in bits (minimum 4096 for security)
 * @param algorithm - Cryptographic algorithm ('rsa' or 'ecc')
 * @returns Promise resolving to generated key pair with metadata
 * 
 * @security Private key generation uses cryptographically secure random sources
 * @compliance FIPS 140-2 Level 4, NSA Suite B approved algorithms
 */
async function generateKeyPair(
  name: string,
  email: string, 
  passphrase: string,
  keySize: number = 4096,
  algorithm: 'rsa' | 'ecc' = 'rsa'
): Promise<PGPKeyPair>
```

### API Documentation

```typescript
/**
 * POST /api/users
 * 
 * Creates a new user account
 * 
 * @body {Object} user - User registration data
 * @body {string} user.username - Unique username (3-50 chars)
 * @body {string} user.password - Password (minimum 12 chars)
 * 
 * @returns {Object} Created user object (without password)
 * @returns {number} id - User ID
 * @returns {string} username - Username
 * @returns {Date} createdAt - Account creation timestamp
 * 
 * @throws {400} Invalid input data
 * @throws {409} Username already exists
 * 
 * @security Passwords are hashed with bcrypt (12 rounds minimum)
 * @note No sensitive user data is stored on server
 */
```

## 🌟 Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- GitHub releases
- Project documentation
- Security hall of fame (for security contributions)

## 📞 Getting Help

- **General Questions**: Open a GitHub discussion
- **Bug Reports**: Open a GitHub issue
- **Security Issues**: Email privately first
- **Development Help**: Join our Discord/Slack (if available)

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

Thank you for helping make PGP Crypter the most secure encryption platform available! 🛡️