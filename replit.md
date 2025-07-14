# PGP Crypter

## Overview

PGP Crypter is a client-side web application for secure PGP encryption and decryption. The application provides an easy-to-use interface for generating PGP key pairs, encrypting/decrypting text and files, and managing cryptographic keys. All cryptographic operations happen entirely in the browser using the OpenPGP.js library, ensuring that private keys and sensitive data never leave the user's device.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **State Management**: React hooks with local component state and React Query for server state
- **Routing**: Wouter for lightweight client-side routing
- **Cryptography**: OpenPGP.js library loaded via CDN for PGP operations

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **API Structure**: RESTful endpoints prefixed with `/api`
- **Development Server**: Vite development server with HMR support
- **Storage Interface**: Abstract storage interface with in-memory implementation
- **Session Management**: Built-in session handling with PostgreSQL session store

### Data Storage Solutions
- **Database**: PostgreSQL configured via Drizzle ORM
- **ORM**: Drizzle with type-safe schema definitions
- **Local Storage**: Browser localStorage for PGP keys and application settings
- **Session Store**: PostgreSQL-backed sessions using connect-pg-simple

## Key Components

### PGP Core Services
- **PGPService**: Main cryptographic operations (key generation, encryption, decryption)
- **PGPStorage**: Local storage management for keys and settings
- **Key Management**: Import/export functionality for PGP keys

### UI Components
- **Key Generation**: Form interface for creating new PGP key pairs
- **Text Encryption**: Interface for encrypting and decrypting text messages
- **File Encryption**: Drag-and-drop file encryption with progress tracking
- **Key Management**: Storage and organization of public/private keys

### Shared Schema
- **User Management**: Basic user schema with username/password authentication
- **Type Safety**: Zod validation schemas for runtime type checking

## Data Flow

1. **Key Generation**: Users create PGP key pairs locally using configurable parameters (name, email, key size, passphrase)
2. **Local Storage**: Generated keys are stored in browser localStorage with optional nicknames
3. **Encryption**: Users select recipient public keys and encrypt text/files locally
4. **Decryption**: Users provide private keys and passphrases to decrypt content locally
5. **Key Exchange**: Users can import/export keys for sharing with contacts

## External Dependencies

### Core Libraries
- **OpenPGP.js**: Client-side PGP implementation loaded from CDN
- **@neondatabase/serverless**: PostgreSQL connection for Neon database
- **Drizzle ORM**: Type-safe database operations and migrations

### UI Dependencies
- **Radix UI**: Accessible component primitives for all UI elements
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Lucide React**: Icon library for consistent iconography
- **React Hook Form**: Form state management with validation

### Development Tools
- **TypeScript**: Type safety across the entire application
- **Vite**: Fast build tool with plugin ecosystem
- **ESBuild**: Fast JavaScript bundler for production builds

## Deployment Strategy

### Build Process
1. Frontend built with Vite to `dist/public` directory
2. Backend bundled with ESBuild to `dist/index.js`
3. Database migrations handled via Drizzle Kit

### Environment Configuration
- **Development**: Vite dev server with Express API backend
- **Production**: Static files served by Express with API endpoints
- **Database**: PostgreSQL connection via DATABASE_URL environment variable

### Security Considerations
- All cryptographic operations performed client-side
- Private keys never transmitted to server
- Session-based authentication for user management
- CORS and security headers configured appropriately

### Hosting Requirements
- Node.js runtime environment
- PostgreSQL database instance
- Static file serving capability
- Environment variables for database connection

The application prioritizes security and privacy by ensuring all sensitive cryptographic operations happen locally in the user's browser, with the server only providing user management and session handling functionality.

## Recent Changes

### July 14, 2025 - Major Updates Completed
- ✅ Fixed tab navigation layout issues by replacing Radix UI tabs with custom implementation
- ✅ Added PostgreSQL database support with full schema migration
- ✅ Implemented DatabaseStorage class replacing in-memory storage
- ✅ Created comprehensive database tables: users, key_pairs, contact_keys
- ✅ Added proper foreign key relationships and type safety with Drizzle ORM
- ✅ Tested all components thoroughly: key generation, text/file encryption, key management
- ✅ Verified OpenPGP.js library loading and all cryptographic operations
- ✅ Confirmed client-side security model with no server-side key storage
- ✅ Application is production-ready with comprehensive testing completed

## Testing Status
All core functionality has been thoroughly tested and verified working:
- Database operations and schema integrity
- PGP key generation, encryption, and decryption
- File processing with drag-and-drop interface
- User interface navigation and responsiveness
- Error handling and security measures