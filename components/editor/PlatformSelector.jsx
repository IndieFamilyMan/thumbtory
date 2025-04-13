"use client";

import { useState, useEffect } from "react";
import { useEditorStore } from "@/store/editor";
import { SocialMediaLayouts } from "@/lib/social-media-layouts";
import { Check } from "lucide-react";

export function PlatformSelector() {
  const { activePlatformId, setActivePlatform } = useEditorStore();
  const [platforms, setPlatforms] = useState([]);

  useEffect(() => {
    // Convert SocialMediaLayouts object to array for rendering
    const platformsArray = Object.entries(SocialMediaLayouts).map(
      ([id, data]) => ({
        id,
        name: id.charAt(0).toUpperCase() + id.slice(1).replace("_", " "),
        ...data,
      })
    );

    setPlatforms(platformsArray);
  }, []);

  const handlePlatformSelect = (platformId) => {
    setActivePlatform(platformId);
  };

  return (
    <div className="mb-4">
      <h3 className="font-medium mb-2">출력 플랫폼 선택</h3>
      <div className="space-y-1 max-h-80 overflow-y-auto">
        {platforms.map((platform) => (
          <div
            key={platform.id}
            className={`flex items-center px-3 py-2 rounded-md cursor-pointer transition-colors ${
              activePlatformId === platform.id
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
            onClick={() => handlePlatformSelect(platform.id)}
          >
            <div className="flex-1">
              <div className="font-medium">{platform.name}</div>
              <div className="text-xs opacity-80">
                {platform.width} x {platform.height}px
              </div>
              {platform.description && (
                <div className="text-xs opacity-70">{platform.description}</div>
              )}
            </div>
            {activePlatformId === platform.id && (
              <Check size={18} className="ml-2 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
