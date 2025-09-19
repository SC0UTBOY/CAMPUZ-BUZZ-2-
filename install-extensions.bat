@echo off
echo Installing VS Code extensions for CampuzBuzz project...

REM Essential extensions for React + TypeScript development
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension ms-vscode.vscode-eslint
code --install-extension esbenp.prettier-vscode

REM React specific
code --install-extension dsznajder.es7-react-js-snippets
code --install-extension formulahendry.auto-rename-tag
code --install-extension christian-kohler.path-intellisense

REM Tailwind CSS
code --install-extension bradlc.vscode-tailwindcss

REM Supabase
code --install-extension supabase.supabase

REM Git and version control
code --install-extension eamodio.gitlens
code --install-extension github.vscode-pull-request-github

REM Database and SQL
code --install-extension ms-mssql.mssql
code --install-extension mtxr.sqltools
code --install-extension mtxr.sqltools-driver-pg

REM UI/UX and design
code --install-extension ms-vscode.vscode-json
code --install-extension redhat.vscode-yaml
code --install-extension ms-vscode.vscode-css-peek
code --install-extension ms-vscode.vscode-html-css-support

REM Productivity and API testing
code --install-extension humao.rest-client
code --install-extension ms-vscode.vscode-thunder-client

REM Code quality
code --install-extension streetsidesoftware.code-spell-checker

REM Development tools
code --install-extension ms-vscode.vscode-npm-scripts
code --install-extension ms-vscode.vscode-js-debug

REM File management
code --install-extension alefragnani.project-manager
code --install-extension ms-vscode.vscode-file-utils

REM Markdown and documentation
code --install-extension yzhang.markdown-all-in-one
code --install-extension davidanson.vscode-markdownlint

REM Theme and appearance
code --install-extension pkief.material-icon-theme
code --install-extension github.github-vscode-theme

echo.
echo Extension installation completed!
echo Please restart VS Code to ensure all extensions are properly loaded.
pause

