# 10. Information Architecture

## Overview

ArenaMind AI follows an AI-first architecture where conversation is the primary navigation model.

Unlike traditional mobile applications that require users to navigate multiple menus and screens, ArenaMind AI minimizes navigation by enabling users to accomplish most tasks through a single conversational interface.

The Information Architecture is intentionally simple, scalable, and optimized for first-time users.

---

# Design Philosophy

The application follows four core principles.

1. Conversation before navigation
2. Mobile-first design
3. Context-aware interactions
4. Minimal cognitive load

Users should never wonder where a feature exists.

If they can describe what they need, the AI should guide them.

---

# User Roles

ArenaMind AI currently supports the following roles.

| Role | Description |
|------|-------------|
| Visitor | Primary stadium visitor |
| Volunteer | Assists visitors |
| Medical Staff | Handles emergency requests |
| Security Staff | Responds to incidents |
| Vendor | Handles food orders |

Future versions may introduce:

- Stadium Administrator
- Operations Manager
- Transport Coordinator

---

# High-Level Sitemap

```
Landing Page
│
├── Welcome
├── AI Chat
├── Quick Actions
├── Ticket
├── Navigation
├── Food
├── Lost & Found
├── Emergency
├── Match Info
├── Venue Guide
├── Transportation
├── Accessibility
├── Notifications
└── Settings
```

Although multiple pages exist, the AI Chat remains the primary entry point for almost every task.

---

# Navigation Structure

## Primary Navigation

Bottom Navigation

- Home
- AI Assistant
- Quick Actions
- Notifications
- Profile

---

## Secondary Navigation

Accessible through contextual actions rather than deep menus.

Examples:

Food Details

↓

Order Summary

↓

Pickup Instructions

---

Emergency

↓

Emergency Details

↓

Confirmation

---

Lost Item

↓

Report

↓

Tracking

---

# Screen Inventory

## 1. Splash Screen

Purpose

Introduce ArenaMind AI branding.

Elements

- Logo
- Loading animation

---

## 2. Welcome Screen

Purpose

Introduce the application.

Elements

- Hero message
- Continue as Guest
- Optional Ticket Linking

---

## 3. Home Dashboard

Purpose

Central hub.

Components

- AI Chat Card
- Quick Actions
- Match Card
- Ticket Summary
- Recommendations
- Recent Activity

---

## 4. AI Assistant Screen

Purpose

Primary interaction screen.

Components

- Chat messages
- Voice button (future)
- Suggested prompts
- Typing indicator
- AI status

---

## 5. Navigation Screen

Displays

- Indoor map
- Route
- ETA
- Destination
- Accessibility toggle

---

## 6. Food Screen

Displays

- Recommended stalls
- Queue estimate
- Menu
- Order summary

---

## 7. Emergency Screen

Displays

- Emergency type
- Current location
- Contact confirmation
- Help status

---

## 8. Lost & Found Screen

Displays

- Report form
- Tracking ID
- Status timeline

---

## 9. Venue Guide

Displays

- Restrooms
- Prayer rooms
- Medical centers
- Charging stations
- Water stations
- Merchandise stores

---

## 10. Transportation

Displays

- Parking
- Taxi
- Metro
- Bus
- Walking directions

---

## 11. Notifications

Displays

- Match reminders
- Emergency alerts
- Order updates
- AI recommendations

---

## 12. Settings

Displays

- Language
- Accessibility
- Theme
- Session
- About

---

# AI Conversation Architecture

Every conversation follows the same flow.

```
User Message
      │
      ▼
Intent Detection
      │
      ▼
Context Retrieval
      │
      ▼
Agent Selection
      │
      ▼
Tool Execution
      │
      ▼
AI Response
      │
      ▼
Suggested Next Action
```

Example

User

"I'm hungry."

↓

Food Agent

↓

Restaurant Recommendation

↓

Pickup Suggestion

↓

Order Confirmation

---

# Quick Actions

The Home screen provides one-tap shortcuts.

Examples

- Find My Seat
- Emergency SOS
- Order Food
- Translate
- Lost Item
- Match Info
- Find Restroom
- Exit Guide

These actions simply pre-fill prompts into the AI chat.

---

# Knowledge Architecture

The AI accesses structured information from a local knowledge base.

Knowledge Categories

- Stadium Information
- Seating Layout
- Match Schedule
- Venue Rules
- FAQs
- Food Vendors
- Transportation
- Accessibility Information

The MVP uses static JSON datasets.

Future versions may connect to live APIs.

---

# Session Architecture

Each anonymous session stores:

- Temporary Session ID
- Linked Ticket (optional)
- Conversation History
- Language Preference
- Accessibility Preference
- Recent Actions

No permanent account is required.

---

# Content Hierarchy

```
Home

↓

AI Assistant

↓

Task

↓

Result

↓

Suggested Next Step
```

The application minimizes deep navigation.

---

# Notification Architecture

Notifications are categorized as:

Information

Examples

- Match starts in 20 minutes

Action

Examples

- Food order ready

Warning

Examples

- Heavy crowd near Gate B

Emergency

Examples

- Follow nearest exit immediately

---

# Accessibility Architecture

Accessibility settings affect every screen.

Examples

Large Text

↓

Larger typography

Voice Mode

↓

Voice-first responses

Wheelchair Mode

↓

Accessible routing

High Contrast

↓

Improved readability

---

# State Management

The frontend maintains:

Global State

- User Session
- Ticket
- Preferences

Conversation State

- Current Intent
- Current Agent
- Previous Messages

UI State

- Active Screen
- Loading
- Error
- Notifications

---

# Folder Structure

```
src/

app/

components/

features/

agents/

hooks/

lib/

services/

types/

utils/

data/

styles/

public/
```

Each feature should remain independent and reusable.

---

# Information Architecture Principles

ArenaMind AI follows these principles:

- AI-first navigation
- Minimal screens
- Maximum discoverability
- Context preservation
- Modular architecture
- Feature independence
- Accessibility-first design

---

# Information Flow Summary

```
Visitor

↓

AI Conversation

↓

Intent Detection

↓

Agent

↓

Knowledge Base

↓

Action

↓

Result

↓

Recommendation
```

The Information Architecture ensures every user interaction remains intuitive, scalable, and centered around natural conversation rather than complex application navigation.
