"use client";

import { User } from "lucide-react";
import { StadiumSelector } from "@/components/profile/stadium-selector";
import { LanguageSelector } from "@/components/profile/language-selector";
import { AccessibilitySettings } from "@/components/profile/accessibility-settings";
import { LinkedTicketForm } from "@/components/profile/linked-ticket-form";

export function ProfileScreen() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 pb-24 pt-8 sm:px-6">
      <header className="flex items-center gap-3">
        <span className="glow-secondary flex size-10 items-center justify-center rounded-2xl bg-secondary/15 text-secondary">
          <User className="size-5" aria-hidden="true" />
        </span>
        <div className="flex flex-col">
          <h1 className="font-heading text-xl tracking-wide text-foreground uppercase">Profile &amp; Settings</h1>
          <p className="text-sm font-medium text-muted-foreground">Preferences apply everywhere in the app immediately.</p>
        </div>
      </header>

      <StadiumSelector />
      <LinkedTicketForm />
      <AccessibilitySettings />
      <LanguageSelector />
    </div>
  );
}
