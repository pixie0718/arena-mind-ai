# 03. Frontend Architecture

Version: 1.0

Project: ArenaMind AI

Framework: Next.js 15 (App Router)

---

# Overview

ArenaMind AI is a frontend-first AI web application.

The frontend is responsible for:

- Rendering the UI
- Managing user interactions
- Maintaining temporary session state
- Streaming AI conversations
- Reading from the local knowledge base
- Communicating with AI services
- Providing a fast and accessible user experience

No dedicated backend is required for the MVP.

---

# Design Principles

The frontend follows these principles.

- Mobile First
- AI First
- Component Driven
- Feature Based
- Accessible by Default
- Server Components First
- Client Components Only When Necessary
- Strong Type Safety
- Reusable UI

---

# Technology Stack

| Technology      | Purpose        |
| --------------- | -------------- |
| Next.js 15      | Framework      |
| React 19        | UI Library     |
| TypeScript      | Type Safety    |
| Tailwind CSS    | Styling        |
| shadcn/ui       | Components     |
| Framer Motion   | Animations     |
| Jotai           | Global State   |
| React Hook Form | Forms          |
| Zod             | Validation     |
| Vercel AI SDK   | AI Integration |
| Lucide React    | Icons          |

---

# Rendering Strategy

The application prefers React Server Components.

Server Components

- Layout
- Static Pages
- Knowledge Base Loading
- SEO Content

Client Components

- AI Chat
- Forms
- Navigation
- Animations
- Session Handling
- Interactive Cards

---

# Folder Structure

```
src/

app/

components/

features/

hooks/

lib/

providers/

services/

store/

types/

utils/

styles/

data/

constants/

public/
```

---

# Feature Structure

Every feature follows the same structure.

```
features/

chat/

components/

hooks/

services/

types/

utils/

index.ts

navigation/

food/

emergency/

transport/

translation/
```

Each feature is isolated.

No feature should directly depend on another.

---

# Component Architecture

Components are divided into four levels.

## Level 1

Primitive UI

Examples

Button

Input

Badge

Card

Avatar

---

## Level 2

Shared Components

Examples

Navbar

Sidebar

Bottom Navigation

Header

Chat Bubble

Search Box

---

## Level 3

Feature Components

Examples

Food Card

Emergency Card

Navigation Card

Venue Card

Translation Panel

---

## Level 4

Screens

Examples

Home

Chat

Food

Emergency

Navigation

Profile

---

# State Management

The frontend uses Jotai.

Global State

- Session
- User Preferences
- Notifications
- Active Ticket

Feature State

- Chat
- Navigation
- Food
- Emergency

Local State

- Form Inputs
- UI Toggles
- Dialogs

---

# Data Flow

```
User

↓

Component

↓

Feature Hook

↓

Service

↓

Knowledge Base / AI

↓

Response

↓

Component

↓

User
```

---

# Hooks

Examples

```
useChat()

useNavigation()

useFood()

useEmergency()

useTranslation()

useNotifications()

useSession()
```

Hooks should contain business logic.

Components should remain as presentational as possible.

---

# Services

Each feature owns its own services.

Example

```
navigation.service.ts

food.service.ts

emergency.service.ts

translation.service.ts
```

Services interact with AI and local data.

---

# Providers

Root Providers

```
ThemeProvider

SessionProvider

AIProvider

TooltipProvider

ToasterProvider
```

Providers should remain lightweight.

---

# Styling Strategy

Tailwind CSS

-

CSS Variables

-

shadcn/ui

No inline styles.

No custom utility duplication.

---

# Theme

Support

- Light
- Dark
- System

Future

- High Contrast Mode

---

# Icons

Lucide React only.

No mixed icon libraries.

---

# Forms

All forms should use:

React Hook Form

-

Zod Validation

Validation should occur before AI requests.

---

# Error Handling

Every async request should support:

Loading

↓

Success

↓

Error

↓

Retry

Never leave the UI in an unknown state.

---

# Loading States

Examples

Skeletons

Typing Indicator

Spinner

Progress Bar

Streaming Responses

Loading should feel intentional.

---

# Responsive Strategy

Breakpoints

Mobile First

Tablet

Desktop

Large Desktop

Touch interactions should always be prioritized.

---

# Accessibility

Every component must support:

Keyboard Navigation

ARIA Labels

Visible Focus

Screen Readers

High Contrast

Reduced Motion

Accessible Colors

---

# Animation Principles

Animations should be:

Fast

Subtle

Purposeful

Consistent

Examples

Fade

Slide

Scale

Skeleton Loading

Typing Animation

Avoid excessive motion.

---

# Performance

Use

- Dynamic Imports
- Lazy Loading
- Image Optimization
- Code Splitting
- Memoization
- Streaming

Avoid unnecessary re-renders.

---

# File Naming

Components

```
ChatInput.tsx

NavigationCard.tsx
```

Hooks

```
useChat.ts
```

Services

```
chat.service.ts
```

Types

```
chat.types.ts
```

---

# Import Order

1. React

2. Next

3. External Libraries

4. Internal Libraries

5. Components

6. Hooks

7. Utils

8. Types

9. Styles

---

# Coding Principles

Keep components small.

Avoid duplicate logic.

Prefer composition.

Prefer reusable utilities.

Use strict typing.

Avoid unnecessary abstractions.

---

# Definition of Done

A frontend feature is complete when:

- UI is responsive.
- Accessibility is verified.
- TypeScript passes.
- ESLint passes.
- Loading states exist.
- Error states exist.
- Empty states exist.
- AI integration works.
- Component is reusable.
- Documentation is updated.

---

# Future Expansion

The frontend architecture supports:

- PWA
- Offline Mode
- Voice Interface
- Camera Features
- Multi-Agent Dashboards
- Wearable Devices
- Live Stadium APIs

without requiring major architectural changes.

---

# Summary

The frontend architecture prioritizes simplicity, scalability, accessibility, and maintainability.

By combining Next.js App Router, React Server Components, Jotai, Tailwind CSS, and the Vercel AI SDK, ArenaMind AI provides a modern foundation capable of supporting both the hackathon MVP and future production deployments.
