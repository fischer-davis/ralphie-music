# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Tauri desktop application** template using React 19, TypeScript, and Vite 7. The frontend uses Shadcn/ui components (built on Radix UI primitives) with Tailwind CSS 4 for styling. The backend is Rust-based via Tauri 2.

**Package Manager:** Bun (configured in `src-tauri/tauri.conf.json`)

## Development Commands

```bash
# Start development server (Vite on port 1420 + Tauri desktop window)
bun run dev          # Vite dev server only
tauri dev            # Full Tauri dev mode (recommended)

# Build for production
bun run build        # TypeScript + Vite build → /dist
tauri build          # Bundle into native executable

# Code quality
bunx ultracite check # Lint with Biome
bunx ultracite fix   # Auto-fix with Biome
```

**Important:** Tauri expects Vite on port 1420 (fixed in `vite.config.ts`). HMR runs on port 1421.

## Architecture

### Frontend-Backend Separation

```
React + Vite (src/)  ←→  Tauri + Rust (src-tauri/)
     Frontend              Backend (System APIs)
```

- **Frontend:** React components, UI logic, Tailwind styling
- **Backend:** Tauri commands (Rust functions callable from frontend via IPC)
- **Communication:** Tauri's invoke API (JSON serialization)

### Key Directories

```
src/
├── components/
│   ├── ui/              # Shadcn/ui components (19 components)
│   ├── theme-provider.tsx
│   └── mode-toggle.tsx
├── lib/
│   └── utils.ts         # cn() utility (clsx + tailwind-merge)
├── hooks/               # Custom React hooks
└── App.tsx              # Root component

src-tauri/
├── src/
│   ├── lib.rs           # Tauri command registration
│   └── main.rs          # Entry point
├── Cargo.toml           # Rust dependencies
└── tauri.conf.json      # App configuration
```

### Path Aliases

TypeScript and Vite are configured with `@/*` → `./src/*`:

```typescript
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
```

## UI Component System

### Shadcn/ui + Radix UI Pattern

Components in `src/components/ui/` follow this architecture:

1. **Radix UI primitives** for accessibility and behavior
2. **Class Variance Authority (CVA)** for variant management
3. **Tailwind CSS** for styling
4. **cn() utility** to merge class names without conflicts

```typescript
// Example: Button component
const buttonVariants = cva(
  "base-styles...",
  {
    variants: {
      variant: { default: "...", outline: "..." },
      size: { sm: "...", lg: "..." }
    }
  }
);

// Usage
<Button variant="outline" size="lg" className="custom-class">
  Click me
</Button>
```

### Adding UI Components

```bash
# Install new Shadcn/ui components
bunx shadcn@latest add [component-name]
```

Components are auto-configured via `components.json`:
- Style: "new-york"
- Base color: "zinc"
- Icon library: lucide-react
- CSS variables enabled

### Theme System

Custom `ThemeProvider` (React Context) wraps the app in `src/main.tsx`:

```typescript
<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
  <App />
</ThemeProvider>
```

- Modes: "light" | "dark" | "system"
- Persists to localStorage
- Applies `.dark` class to `documentElement`
- Access via `useTheme()` hook

**Color tokens** are defined in `src/App.css` using oklch() color space with CSS variables (--primary, --destructive, --muted, etc.).

## Tauri Integration

### Adding Rust Commands

1. Define command in `src-tauri/src/lib.rs`:

```rust
#[tauri::command]
fn my_command(arg: &str) -> String {
    format!("Result: {}", arg)
}
```

2. Register in `invoke_handler`:

```rust
.invoke_handler(tauri::generate_handler![greet, my_command])
```

3. Call from frontend:

```typescript
import { invoke } from "@tauri-apps/api/core";

const result = await invoke<string>("my_command", { arg: "test" });
```

### Installed Plugins

- **tauri-plugin-opener:** Opens URLs/files in system default application

## Code Quality

### Biome Configuration

- **Formatter:** 2-space indentation, 80-char line width, double quotes, always semicolons
- **Linter:** Recommended rules enabled
- **Git-aware:** Ignores `src/components/ui` and `src/App.css` (generated files)
- **CSS:** Tailwind directives supported

**Do not lint/format:**
- Shadcn/ui components (`src/components/ui/`)
- Generated CSS (`src/App.css`)

### TypeScript

Strict mode enabled in `tsconfig.json`:
- No unused locals/parameters
- No fallthrough cases
- Modern JSX transform (`jsx: "react-jsx"`)

## Build System

### Development Build Flow

```
tauri dev
  ├─> bun run dev (beforeDevCommand)
  │     └─> vite (port 1420)
  └─> Opens Tauri window → http://localhost:1420
```

### Production Build Flow

```
tauri build
  ├─> bun run build (beforeBuildCommand)
  │     ├─> tsc (type check)
  │     └─> vite build → dist/
  └─> Bundle dist/ into native executable
        └─> Icons from src-tauri/icons/
```

## Styling Conventions

1. **Use cn() for conditional classes:**
   ```typescript
   <div className={cn("base-class", condition && "conditional-class")} />
   ```

2. **Tailwind merge prevents conflicts:**
   ```typescript
   cn("px-4", "px-2") // → "px-2" (last wins)
   ```

3. **Color system uses CSS variables:**
   ```css
   background-color: hsl(var(--primary));
   /* Dark mode overrides in .dark selector */
   ```

4. **Typography uses custom fonts:**
   - Sans: Plus Jakarta Sans
   - Serif: Lora
   - Mono: IBM Plex Mono

## Common Patterns

### Component Composition

Use `asChild` prop to merge Radix components:

```typescript
<Button asChild>
  <a href="/link">Link Button</a>
</Button>
```

### Accessing System APIs

```typescript
import { open } from "@tauri-apps/plugin-opener";

// Open URL in browser
await open("https://example.com");
```

## Project Configuration Files

- **package.json:** Node dependencies, npm scripts
- **components.json:** Shadcn/ui configuration
- **vite.config.ts:** Vite + React + Tailwind setup
- **tsconfig.json:** TypeScript compiler options
- **biome.jsonc:** Code formatting and linting rules
- **src-tauri/tauri.conf.json:** Tauri app configuration
  - Window size: 800x600
  - Dev URL: http://localhost:1420
  - Bundle identifier: com.fischer.ralphie-desktop-template

## Notes

- **No testing framework configured** (add Vitest/Jest as needed)
- **Vite ignores src-tauri/** to prevent watch loops
- **Biome replaces ESLint + Prettier** for all formatting/linting
- **React 19 requires updated types** (@types/react@19.x)
