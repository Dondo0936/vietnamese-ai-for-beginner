"use client";

import { useState, useCallback, useEffect } from "react";
import { useKidsMode } from "@/lib/kids/mode-context";

interface MascotBubbleProps {
  text: string;
  mood?: "happy" | "curious" | "oops" | "celebrate";
  autoSpeak?: boolean;
}

const MOOD_EMOJI: Record<string, string> = {
  happy: "🐙",
  curious: "🤔",
  oops: "😅",
  celebrate: "🎉",
};

export default function MascotBubble({
  text,
  mood = "happy",
  autoSpeak = true,
}: MascotBubbleProps) {
  const { audioNarration } = useKidsMode();
  const [speaking, setSpeaking] = useState(false);

  const speak = useCallback(() => {
    if (!audioNarration || typeof window === "undefined") return;
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "vi-VN";
    utterance.rate = 0.85;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [text, audioNarration]);

  useEffect(() => {
    if (autoSpeak && audioNarration) {
      const timer = setTimeout(speak, 400);
      return () => {
        clearTimeout(timer);
        window.speechSynthesis?.cancel();
      };
    }
  }, [autoSpeak, audioNarration, speak]);

  return (
    <div className="flex items-end gap-2">
      <button
        type="button"
        onClick={speak}
        aria-label="Nghe lại"
        className={`text-3xl transition-transform ${speaking ? "animate-bounce" : "hover:scale-110"}`}
      >
        {MOOD_EMOJI[mood] ?? "🐙"}
      </button>
      <div className="relative rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 px-4 py-2 text-sm text-foreground max-w-xs">
        <div className="absolute -left-2 bottom-2 w-0 h-0 border-t-[6px] border-t-transparent border-r-[8px] border-r-amber-200 dark:border-r-amber-500/30 border-b-[6px] border-b-transparent" />
        {text}
      </div>
    </div>
  );
}
