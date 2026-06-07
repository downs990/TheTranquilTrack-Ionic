import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Capacitor } from "@capacitor/core";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function saveCsv(filename: string, content: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    // Call the custom native FileSaver plugin registered in MainActivity.java
    const { FileSaver } = (Capacitor as any).Plugins;
    await FileSaver.saveCsv({ filename, content });
    return;
  }

  // Web: prefer share sheet (mobile browsers), fall back to blob download (desktop)
  const file = new File([content], filename, { type: "text/csv" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename });
      return;
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
    }
  }

  const url = URL.createObjectURL(new Blob([content], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

