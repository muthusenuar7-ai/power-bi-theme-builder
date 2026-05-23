# Project setup commands

Run in PowerShell:

```powershell
cd I:\
npx create-next-app@latest datacense-pbi-theme-studio --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd datacense-pbi-theme-studio

npm install zustand lucide-react clsx tailwind-merge html-to-image zod
npx shadcn@latest init
npx shadcn@latest add button input label select slider tabs card badge tooltip scroll-area dropdown-menu popover separator toast

mkdir docs
mkdir docs\reference
mkdir docs\agent-prompts
mkdir .claude
mkdir .claude\skills
mkdir .claude\commands
mkdir .codex
mkdir .codex\skills
mkdir public\assets

git init
npm run dev
```
