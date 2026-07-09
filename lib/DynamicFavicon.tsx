"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function DynamicFavicon() {
  useEffect(() => {
    const supabase = createClient();
    const loadFavicon = async () => {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "favicon_url")
          .single();

        if (error) {
          // If key doesn't exist yet, do nothing (keep default favicon)
          return;
        }

        if (data?.value) {
          // Find or create favicon link tags
          let linkIcon: HTMLLinkElement | null = document.querySelector("link[rel='icon']");
          let linkShortcut: HTMLLinkElement | null = document.querySelector("link[rel='shortcut icon']");

          if (!linkIcon) {
            linkIcon = document.createElement("link");
            linkIcon.rel = "icon";
            document.head.appendChild(linkIcon);
          }
          linkIcon.href = data.value;

          if (linkShortcut) {
            linkShortcut.href = data.value;
          }
        }
      } catch (err) {
        console.error("Error loading dynamic favicon:", err);
      }
    };

    loadFavicon();
  }, []);

  return null;
}
