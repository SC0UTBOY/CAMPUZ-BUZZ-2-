# PowerShell script to install all required VS Code extensions for CampuzBuzz project

Write-Host "Installing VS Code extensions for CampuzBuzz project..." -ForegroundColor Green

# Essential extensions for React + TypeScript development
$extensions = @(
    # Core TypeScript and JavaScript
    "ms-vscode.vscode-typescript-next",
    "ms-vscode.vscode-eslint",
    "esbenp.prettier-vscode",
    
    # React specific
    "dsznajder.es7-react-js-snippets",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    
    # Tailwind CSS
    "bradlc.vscode-tailwindcss",
    
    # Supabase
    "supabase.supabase",
    
    # Git and version control
    "eamodio.gitlens",
    "github.vscode-pull-request-github",
    
    # Database and SQL
    "ms-mssql.mssql",
    "mtxr.sqltools",
    "mtxr.sqltools-driver-pg",
    
    # UI/UX and design
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml",
    "ms-vscode.vscode-css-peek",
    "ms-vscode.vscode-html-css-support",
    
    # Productivity and API testing
    "humao.rest-client",
    "ms-vscode.vscode-thunder-client",
    
    # Code quality
    "streetsidesoftware.code-spell-checker",
    
    # Development tools
    "ms-vscode.vscode-npm-scripts",
    "ms-vscode.vscode-js-debug",
    
    # File management
    "alefragnani.project-manager",
    "ms-vscode.vscode-file-utils",
    
    # Markdown and documentation
    "yzhang.markdown-all-in-one",
    "davidanson.vscode-markdownlint",
    
    # Theme and appearance
    "pkief.material-icon-theme",
    "github.github-vscode-theme"
)

# Install each extension
foreach ($extension in $extensions) {
    Write-Host "Installing $extension..." -ForegroundColor Yellow
    code --install-extension $extension
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Successfully installed $extension" -ForegroundColor Green
    } else {
        Write-Host "Failed to install $extension" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Extension installation completed!" -ForegroundColor Green
Write-Host "Please restart VS Code to ensure all extensions are properly loaded." -ForegroundColor Cyan