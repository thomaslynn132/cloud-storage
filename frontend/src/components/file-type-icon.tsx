const extensionColors: Record<string, string> = {
  // Documents
  pdf: 'bg-red-100 text-red-700',
  doc: 'bg-blue-100 text-blue-700',
  docx: 'bg-blue-100 text-blue-700',
  xls: 'bg-green-100 text-green-700',
  xlsx: 'bg-green-100 text-green-700',
  ppt: 'bg-orange-100 text-orange-700',
  pptx: 'bg-orange-100 text-orange-700',
  txt: 'bg-gray-200 text-gray-700',
  rtf: 'bg-gray-200 text-gray-700',
  csv: 'bg-green-100 text-green-700',
  md: 'bg-indigo-100 text-indigo-700',

  // Images
  jpg: 'bg-pink-100 text-pink-700',
  jpeg: 'bg-pink-100 text-pink-700',
  png: 'bg-pink-100 text-pink-700',
  gif: 'bg-purple-100 text-purple-700',
  svg: 'bg-yellow-100 text-yellow-700',
  webp: 'bg-pink-100 text-pink-700',
  ico: 'bg-cyan-100 text-cyan-700',
  bmp: 'bg-blue-100 text-blue-700',
  tiff: 'bg-pink-100 text-pink-700',

  // Video
  mp4: 'bg-violet-100 text-violet-700',
  avi: 'bg-violet-100 text-violet-700',
  mov: 'bg-violet-100 text-violet-700',
  wmv: 'bg-violet-100 text-violet-700',
  flv: 'bg-violet-100 text-violet-700',
  mkv: 'bg-violet-100 text-violet-700',

  // Audio
  mp3: 'bg-amber-100 text-amber-700',
  wav: 'bg-amber-100 text-amber-700',
  flac: 'bg-amber-100 text-amber-700',
  ogg: 'bg-amber-100 text-amber-700',
  aac: 'bg-amber-100 text-amber-700',
  wma: 'bg-amber-100 text-amber-700',

  // Archives
  zip: 'bg-teal-100 text-teal-700',
  rar: 'bg-teal-100 text-teal-700',
  '7z': 'bg-teal-100 text-teal-700',
  tar: 'bg-teal-100 text-teal-700',
  gz: 'bg-teal-100 text-teal-700',
  bz2: 'bg-teal-100 text-teal-700',

  // Code
  js: 'bg-yellow-100 text-yellow-700',
  ts: 'bg-blue-100 text-blue-700',
  jsx: 'bg-cyan-100 text-cyan-700',
  tsx: 'bg-blue-100 text-blue-700',
  html: 'bg-orange-100 text-orange-700',
  css: 'bg-indigo-100 text-indigo-700',
  scss: 'bg-pink-100 text-pink-700',
  json: 'bg-gray-200 text-gray-700',
  xml: 'bg-gray-200 text-gray-700',
  yaml: 'bg-gray-200 text-gray-700',
  py: 'bg-blue-100 text-blue-700',
  rb: 'bg-red-100 text-red-700',
  go: 'bg-cyan-100 text-cyan-700',
  rs: 'bg-orange-100 text-orange-700',
  java: 'bg-red-100 text-red-700',
  cpp: 'bg-blue-100 text-blue-700',
  c: 'bg-blue-100 text-blue-700',
  h: 'bg-blue-100 text-blue-700',
  php: 'bg-indigo-100 text-indigo-700',
  swift: 'bg-orange-100 text-orange-700',
  sql: 'bg-blue-100 text-blue-700',
  sh: 'bg-green-100 text-green-700',

  // Executables
  exe: 'bg-red-100 text-red-700',
  msi: 'bg-red-100 text-red-700',
  dmg: 'bg-red-100 text-red-700',
  appimage: 'bg-red-100 text-red-700',
};

interface FileTypeIconProps {
  fileName: string;
  className?: string;
}

export function FileTypeIcon({ fileName, className = '' }: FileTypeIconProps) {
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  const colorClass = extensionColors[ext] || 'bg-gray-100 text-gray-600';

  return (
    <span
      className={`inline-flex items-center justify-center rounded px-1.5 py-0.5 font-mono text-xs font-medium leading-none ${colorClass} ${className}`}
      title={ext.toUpperCase()}
    >
      {ext || '?'}
    </span>
  );
}
