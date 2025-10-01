"use client";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion } from "framer-motion";

export type FolderItem = { name: string; fullPrefix: string };
export type FileItem = { key: string; name: string; sizeLabel: string; dateLabel: string };

export function CardGrid({
  folders,
  files,
  onOpenFolder,
  onDownload,
}: {
  folders: FolderItem[];
  files: FileItem[];
  onOpenFolder: (prefix: string) => void;
  onDownload: (key: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {folders.map((f) => (
        <GlassCard key={f.fullPrefix} className="cursor-pointer" onClick={() => onOpenFolder(f.fullPrefix)}>
          <div className="flex items-center gap-3">
            <span className="text-xl">📁</span>
            <div className="min-w-0">
              <div className="truncate font-semibold text-gray-900">{f.name}</div>
              <div className="text-sm text-gray-500">Folder</div>
            </div>
          </div>
        </GlassCard>
      ))}
      {files.map((f) => (
        <GlassCard key={f.key}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="text-xl">📄</span>
              <div className="min-w-0">
                <div className="truncate text-gray-900">{f.name}</div>
                <div className="text-sm text-gray-500">{f.sizeLabel} • {f.dateLabel}</div>
              </div>
            </div>
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="btn btn-ghost"
              onClick={() => onDownload(f.key)}
            >
              Download
            </motion.button>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
