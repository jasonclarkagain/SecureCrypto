# Contributing to PGP Crypter

Thank you for your interest in contributing to PGP Crypter! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
3. Install dependencies: `npm install`
4. Set up your development environment (see README.md)
5. Create a new branch for your feature or bug fix

## Development Guidelines

### Code Style

- Use TypeScript for all new code
- Follow the existing code style (we use Prettier for formatting)
- Write meaningful commit messages
- Add comments for complex logic

### Security Considerations

Since this is a security-focused application:

- Never modify the client-side cryptography without thorough review
- Ensure private keys are never transmitted to the server
- Test all changes with real PGP operations
- Review OpenPGP.js usage carefully

### Testing

- Test your changes thoroughly
- Verify PGP operations work correctly
- Check both key generation and encryption/decryption
- Test on different browsers if possible

## Submitting Changes

1. Ensure your code follows the project style
2. Update documentation if needed
3. Write a clear commit message
4. Push to your fork
5. Create a pull request

### Pull Request Guidelines

- Clearly describe what your PR does
- Reference any related issues
- Include screenshots for UI changes
- Ensure all checks pass

## Reporting Issues

When reporting bugs:

- Use a clear, descriptive title
- Describe steps to reproduce
- Include your browser and OS information
- Mention if it affects cryptographic operations

## Security Issues

For security-related issues:

- Email directly instead of creating public issues
- Provide detailed information about the vulnerability
- Allow time for fixes before public disclosure

## Questions?

Feel free to open an issue for questions about contributing or development.

Thank you for helping make PGP Crypter better!