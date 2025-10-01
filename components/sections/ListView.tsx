"use client";
import React from "react";

export type ListFolder = { name: string; fullPrefix: string };
export type ListFile = { key: string; name: string; sizeLabel: string; dateLabel: string };

export function ListView({
  folders,
  files,
  onOpenFolder,
  onDownload,
}: {
  folders: ListFolder[];
  files: ListFile[];
  onOpenFolder: (prefix: string) => void;
  onDownload: (key: string) => void;
}) {
  return (
    <div className="glass-lift overflow-hidden rounded-2xl border border-white/60 shadow-glass">
      <div className="grid grid-cols-[minmax(200px,1fr)_100px_160px_120px] items-center gap-2 border-b border-white/60 bg-white/70 px-4 py-3 text-[11px] uppercase tracking-wide text-gray-500 md:text-xs">
        <div>Name</div>
        <div className="text-right">Size</div>
        <div>Last modified</div>
        <div className="text-right">Action</div>
      </div>
      {/* Folders */}
      {folders.map((f, idx) => (
        <div
          key={f.fullPrefix}
          className={`grid grid-cols-[minmax(200px,1fr)_100px_160px_120px] items-center gap-2 px-4 py-3 border-b border-white/50 hover:bg-white/80 ${
            idx % 2 === 0 ? 'bg-white/70' : 'bg-white/60'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xl">📁</span>
            <button onClick={() => onOpenFolder(f.fullPrefix)} className="truncate text-left font-semibold text-gray-900 hover:underline">
              {f.name}
            </button>
          </div>
          <div className="text-right text-gray-500">—</div>
          <div className="text-gray-500">—</div>
          <div className="text-right">
            <button onClick={() => onOpenFolder(f.fullPrefix)} className="btn btn-ghost">Open</button>
          </div>
        </div>
      ))}
      {/* Files */}
      {files.map((f, idx) => (
        <div
          key={f.key}
          className={`grid grid-cols-[minmax(200px,1fr)_100px_160px_120px] items-center gap-2 px-4 py-3 border-b border-white/50 hover:bg-white/80 ${
            (folders.length + idx) % 2 === 0 ? 'bg-white/70' : 'bg-white/60'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xl">📄</span>
            <span className="truncate">{f.name}</span>
          </div>
          <div className="text-right">{f.sizeLabel}</div>
          <div>{f.dateLabel}</div>
          <div className="text-right">
            <button onClick={() => onDownload(f.key)} className="btn btn-ghost">Download</button>
          </div>
        </div>
      ))}
    </div>
  );
}
