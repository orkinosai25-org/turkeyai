# Contributing to TürkiyeAI

Thank you for your interest in contributing to TürkiyeAI! This document provides guidelines for contributing to the project.

## Code of Conduct

This project is maintained by OrkinosAI Ltd. We expect all contributors to be respectful and professional.

## Getting Started

1. **Fork the repository** (if you have access)
2. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/turkeyai.git
   cd turkeyai
   ```
3. **Install dependencies**
   ```bash
   npm run install-all
   ```
4. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Running Locally

```bash
# Run both client and server
npm run dev

# Or run separately
npm run server  # Backend on port 5000
npm run client  # Frontend on port 3000
```

### Making Changes

1. Make your changes in a feature branch
2. Follow the existing code style
3. Test your changes thoroughly
4. Write clear commit messages
5. Push to your fork
6. Create a Pull Request

## Code Style

### JavaScript/React

- Use modern ES6+ syntax
- Use functional components with hooks for React
- Follow consistent naming conventions:
  - Components: PascalCase (`ChatInterface.js`)
  - Utilities: camelCase (`formatDate.js`)
  - Constants: UPPER_CASE (`API_BASE_URL`)

### CSS

- Use CSS3 with Azure-inspired color palette
- Follow BEM naming convention where appropriate
- Keep styles modular and reusable

### Backend

- Use async/await for asynchronous operations
- Handle errors properly with try/catch
- Document complex logic with comments
- Keep routes thin, move business logic to controllers

## Commit Messages

Follow conventional commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

Example:
```
feat(chat): add conversation history support

Implement conversation history in chat component to maintain context
across multiple messages. Includes state management and API integration.

Closes #123
```

## Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new features
3. **Ensure CI passes** (when CI is set up)
4. **Request review** from maintainers
5. **Address feedback** promptly

## Testing

Currently, tests are minimal. When adding tests:

```bash
# Run tests (when available)
cd client && npm test
cd server && npm test
```

## Adding New Features

### New API Endpoint

1. Create route in `server/routes/`
2. Add controller logic in `server/controllers/`
3. Update API documentation in `docs/API.md`
4. Add integration to frontend if needed

### New React Component

1. Create component in `client/src/components/`
2. Import and use in appropriate page
3. Add styles to component or `App.css`
4. Ensure responsive design

### New Azure Integration

1. Add configuration in `server/config/`
2. Document setup in `docs/AZURE_SETUP.md`
3. Update `.env.example` with new variables
4. Add error handling for missing credentials

## Azure AI Integration Guidelines

When working with Azure AI services:

1. **Use environment variables** for all credentials
2. **Implement retry logic** for API calls
3. **Handle rate limits** gracefully
4. **Cache responses** when appropriate
5. **Log errors** for debugging

## Database Changes

When modifying the database schema:

1. Update `database/schema.sql`
2. Create migration scripts if needed
3. Update models/types
4. Document changes

## Documentation

Keep documentation up to date:

- Update README.md for major changes
- Update API.md for API changes
- Update AZURE_SETUP.md for Azure changes
- Add JSDoc comments for complex functions

## Brand Guidelines

Remember TürkiyeAI brand guidelines:

- **Colors:** Use Azure-inspired palette (blue #0078d4)
- **Tone:** Friendly, helpful, expert
- **Language:** Clear and accessible
- **Turkish focus:** Emphasize Turkish destinations
- **OrkinosAI branding:** Always credit "Powered by OrkinosAI"

## Questions?

If you have questions:

1. Check existing documentation
2. Search existing issues
3. Create a new issue with the "question" label
4. Contact OrkinosAI Ltd

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to TürkiyeAI! 🇹🇷🌊
