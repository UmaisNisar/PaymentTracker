export default function ImageLightbox({ src, label, onClose }) {
  if (!src) return null
  return (
    <div
      className="fixed inset-0 z-[60] flex animate-backdrop-in items-center justify-center bg-black/85 p-4 backdrop-blur-sm motion-reduce:animate-none"
      role="dialog"
      aria-modal="true"
      aria-label={label || 'Image preview'}
      onClick={onClose}
    >
      <button
        type="button"
        className="absolute right-4 top-4 rounded border border-nasa-cyan/40 bg-nasa-panel px-3 py-1 font-mono text-xs text-nasa-cyan transition-all duration-200 ease-out hover:border-nasa-cyan hover:bg-nasa-line hover:shadow-[0_0_16px_-4px_rgba(0,212,255,0.35)] active:scale-95"
        onClick={onClose}
      >
        CLOSE
      </button>
      <figure
        className="max-h-[90vh] max-w-[95vw] animate-lightbox-in motion-reduce:animate-none"
        onClick={(e) => e.stopPropagation()}
      >
        {label && (
          <figcaption className="mb-2 text-center font-mono text-xs uppercase tracking-widest text-nasa-cyan">
            {label}
          </figcaption>
        )}
        <img
          src={src}
          alt={label || ''}
          className="max-h-[85vh] max-w-full rounded border border-nasa-cyan/30 object-contain shadow-nasa-glow"
        />
      </figure>
    </div>
  )
}
