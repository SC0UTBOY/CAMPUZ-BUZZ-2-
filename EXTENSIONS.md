





# VS Code Extensions for CampuzBuzz Project

This document lists all the recommended VS Code extensions for optimal development experience with the CampuzBuzz project.

## 🚀 Quick Installation

### Option 1: Automatic Installation (Recommended)
Run one of these scripts in your terminal:

**For Windows (PowerShell):**
```powershell
.\install-extensions.ps1
```

**For Windows (Command Prompt):**
```cmd
install-extensions.bat
```

### Option 2: Manual Installation
Open VS Code and press `Ctrl+Shift+P`, then type "Extensions: Install Extensions" and install each extension from the list below.

## 📋 Essential Extensions

### Core Development
- **TypeScript and JavaScript Language Features** (`ms-vscode.vscode-typescript-next`)
  - Enhanced TypeScript support with latest features
  - Essential for React + TypeScript development

- **ESLint** (`ms-vscode.vscode-eslint`)
  - JavaScript/TypeScript linting
  - Enforces code quality and style

- **Prettier - Code formatter** (`esbenp.prettier-vscode`)
  - Automatic code formatting
  - Consistent code style across the project

### React Development
- **ES7+ React/Redux/React-Native snippets** (`dsznajder.es7-react-js-snippets`)
  - Useful React code snippets
  - Speeds up component development

- **Auto Rename Tag** (`formulahendry.auto-rename-tag`)
  - Automatically renames paired HTML/JSX tags
  - Essential for React development

- **Path Intellisense** (`christian-kohler.path-intellisense`)
  - Autocompletes filenames
  - Helps with import statements

### Styling and UI
- **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`)
  - Autocomplete, syntax highlighting, and linting for Tailwind CSS
  - Essential for this project's styling

- **CSS Peek** (`ms-vscode.vscode-css-peek`)
  - Allows peeking at CSS definitions
  - Helpful for debugging styles

- **HTML CSS Support** (`ms-vscode.vscode-html-css-support`)
  - CSS support in HTML files
  - Better IntelliSense for CSS classes

### Backend and Database
- **Supabase** (`supabase.supabase`)
  - Official Supabase extension
  - Database management and queries

- **SQLTools** (`mtxr.sqltools`)
  - Database management
  - Query execution and database exploration

- **SQLTools PostgreSQL/Cockroach Driver** (`mtxr.sqltools-driver-pg`)
  - PostgreSQL driver for SQLTools
  - Required for Supabase database connections

### Git and Version Control
- **GitLens — Git supercharged** (`eamodio.gitlens`)
  - Enhanced Git capabilities
  - Blame annotations, file history, and more

- **GitHub Pull Requests and Issues** (`github.vscode-pull-request-github`)
  - Manage pull requests and issues directly in VS Code
  - Streamlined GitHub workflow

### API Testing and Development
- **REST Client** (`humao.rest-client`)
  - Test HTTP requests directly in VS Code
  - Useful for testing API endpoints

- **Thunder Client** (`ms-vscode.vscode-thunder-client`)
  - Lightweight API testing tool
  - Alternative to Postman

### Code Quality and Productivity
- **Code Spell Checker** (`streetsidesoftware.code-spell-checker`)
  - Catches spelling errors in code
  - Improves code quality

- **Project Manager** (`alefragnani.project-manager`)
  - Manage multiple projects
  - Quick project switching

- **File Utils** (`ms-vscode.vscode-file-utils`)
  - Additional file operations
  - Enhanced file management

### Documentation
- **Markdown All in One** (`yzhang.markdown-all-in-one`)
  - Enhanced Markdown support
  - Preview, formatting, and more

- **markdownlint** (`davidanson.vscode-markdownlint`)
  - Markdown linting
  - Ensures consistent documentation

### Themes and Appearance
- **Material Icon Theme** (`pkief.material-icon-theme`)
  - Beautiful file and folder icons
  - Better visual organization

- **GitHub Theme** (`github.github-vscode-theme`)
  - GitHub's official VS Code theme
  - Clean and professional appearance

## 🔧 Configuration

After installing the extensions, VS Code will automatically:
- Use the recommended extensions from `.vscode/extensions.json`
- Apply appropriate settings for the project
- Enable IntelliSense for all supported file types

## 📝 Additional Setup

1. **Restart VS Code** after installing extensions
2. **Reload the window** (`Ctrl+Shift+P` → "Developer: Reload Window")
3. **Check the Output panel** for any extension-related messages

## 🐛 Troubleshooting

If you encounter issues:

1. **Extension not working**: Try reloading the window
2. **IntelliSense not working**: Check if TypeScript is properly configured
3. **Tailwind CSS not working**: Ensure the Tailwind extension is enabled
4. **Database connection issues**: Verify Supabase credentials

## 📚 Resources

- [VS Code Extension Marketplace](https://marketplace.visualstudio.com/vscode)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Documentation](https://react.dev/)

---

**Note**: This project uses modern web technologies including React 18, TypeScript, Tailwind CSS, and Supabase. All recommended extensions are compatible with these technologies and will enhance your development experience.





















