# PGP Crypter

A secure, user-friendly web-based PGP encryption and decryption application that puts privacy first.

## 🔐 Features

- **Key Generation**: Create RSA 2048/4096-bit PGP key pairs with customizable parameters
- **Text Encryption**: Encrypt and decrypt text messages using public/private keys
- **File Encryption**: Secure file encryption with drag-and-drop support
- **Key Management**: Import, export, and organize your PGP keys and contacts
- **Client-Side Security**: All cryptographic operations happen in your browser - your keys never leave your device
- **Database Persistence**: User and key management with PostgreSQL backend

## 🛡️ Security

- **Zero Server-Side Key Storage**: Private keys are never transmitted to or stored on the server
- **Browser-Only Cryptography**: All encryption/decryption uses OpenPGP.js in your browser
- **Local Storage**: Keys are stored locally in your browser's secure storage
- **Open Source**: Full transparency with open source code

## 🚀 Quick Start

### Prerequisites

- Node.js 18 or higher
- PostgreSQL database
- Modern web browser

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/pgp-crypter.git
cd pgp-crypter
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create .env file with your database URL
echo "DATABASE_URL=your_postgresql_connection_string" > .env
```

4. Push database schema:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

6. Open your browser to `http://localhost:5000`

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and builds
- **Tailwind CSS** for styling with shadcn/ui components
- **OpenPGP.js** for cryptographic operations
- **Wouter** for lightweight routing

### Backend
- **Express.js** server
- **PostgreSQL** with Drizzle ORM
- **Session-based authentication**
- **RESTful API** for user management

### Security Model
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Your Browser  │    │   PGP Crypter    │    │   PostgreSQL    │
│                 │    │     Server       │    │   Database      │
│ ┌─────────────┐ │    │                  │    │                 │
│ │ Private Keys│ │    │  User Accounts   │    │  User Profiles  │
│ │ (Local Only)│ │    │  Public Keys     │◄──►│  Public Keys    │
│ │             │ │    │  Session Data    │    │  Contact Lists  │
│ └─────────────┘ │    │                  │    │                 │
│                 │    │                  │    │                 │
│ OpenPGP.js      │    │                  │    │                 │
│ Encryption      │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 📱 Usage

### Generate Keys
1. Navigate to the "Generate Keys" tab
2. Enter your name and email
3. Choose key size (2048 or 4096 bits)
4. Set a strong passphrase
5. Click "Generate Key Pair"

### Encrypt Text
1. Go to "Text Encryption" tab
2. Enter your message
3. Select recipient's public key
4. Click "Encrypt" to get armored output

### Encrypt Files
1. Open "File Encryption" tab
2. Drag and drop files or click to select
3. Choose recipient's public key
4. Download encrypted files

### Manage Keys
1. Use "Key Management" tab
2. Import/export key pairs
3. Add contact public keys
4. Organize with nicknames

## 🔧 Development

### Project Structure
```
pgp-crypter/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Main application pages
│   │   ├── lib/           # Utilities and services
│   │   └── hooks/         # Custom React hooks
├── server/                # Express backend
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Database storage layer
│   └── db.ts            # Database connection
├── shared/               # Shared types and schemas
│   └── schema.ts        # Drizzle database schema
└── package.json
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run db:push      # Push schema changes to database
npm run db:studio    # Open Drizzle Studio
```

### Environment Variables

```bash
DATABASE_URL=postgresql://user:password@host:port/database
NODE_ENV=development
```

## 🚢 Deployment

### Replit (Recommended)
1. Fork this repository on Replit
2. Set up PostgreSQL database
3. Configure environment variables
4. Deploy using Replit's one-click deployment

### Manual Deployment
1. Build the application: `npm run build`
2. Set up PostgreSQL database
3. Configure production environment variables
4. Start the server: `npm start`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Run tests: `npm test`
5. Commit changes: `git commit -m "Add feature"`
6. Push to branch: `git push origin feature-name`
7. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenPGP.js](https://openpgpjs.org/) for client-side cryptography
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Drizzle ORM](https://orm.drizzle.team/) for type-safe database operations

## 🔗 Links

- **Live Demo**: [Your deployment URL]
- **Documentation**: [Your docs URL]
- **Issues**: [GitHub Issues](https://github.com/yourusername/pgp-crypter/issues)

---

Made with ♥ by [Jason Clark](https://jason-clark.org)