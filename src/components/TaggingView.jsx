import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ImagePlus, Save, Trash2, MapPinned, PencilLine } from 'lucide-react';
import { createId } from '../lib/storage';

const HEIC_MIME_TYPES = new Set([
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
]);

function clampPercentage(value) {
  return Math.min(100, Math.max(0, value));
}

function isHeicFile(file) {
  return HEIC_MIME_TYPES.has(file.type.toLowerCase()) || /\.(heic|heif)$/i.test(file.name);
}

function readBlobAsDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read image file.'));
    reader.readAsDataURL(blob);
  });
}

async function convertHeicToJpeg(file) {
  const { default: heic2any } = await import('heic2any');
  const convertedImage = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.92,
  });

  return Array.isArray(convertedImage) ? convertedImage[0] : convertedImage;
}

function TagPin({ index, tag }) {
  return (
    <div
      className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${tag.x}%`, top: `${tag.y}%` }}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-coral text-xs font-bold text-slate-950 shadow-lg shadow-coral/30">
        {index + 1}
      </div>
    </div>
  );
}

export default function TaggingView({ initialModule, onSave, onCancel, isSaving = false }) {
  const [title, setTitle] = useState(initialModule?.title ?? '');
  const [imageData, setImageData] = useState(initialModule?.imageData ?? '');
  const [tags, setTags] = useState(initialModule?.tags ?? []);
  const [pendingTag, setPendingTag] = useState(null);
  const [pendingLabel, setPendingLabel] = useState('');
  const [error, setError] = useState('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const imageAreaRef = useRef(null);
  const popoverInputRef = useRef(null);

  useEffect(() => {
    if (pendingTag && popoverInputRef.current) {
      popoverInputRef.current.focus();
    }
  }, [pendingTag]);

  const handleImageUpload = async (event) => {
    const input = event.target;
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setError('');
    setIsProcessingImage(true);

    try {
      const imageBlob = isHeicFile(file) ? await convertHeicToJpeg(file) : file;
      const nextImageData = await readBlobAsDataUrl(imageBlob);

      setImageData(nextImageData);
      setPendingTag(null);
      setPendingLabel('');
    } catch (uploadError) {
      console.error('Failed to process uploaded image', uploadError);
      setError(
        isHeicFile(file)
          ? 'Could not convert that HEIC image. Try a different file.'
          : 'Could not read that image file. Try a different file.'
      );
    } finally {
      input.value = '';
      setIsProcessingImage(false);
    }
  };

  const handleImageClick = (event) => {
    if (!imageAreaRef.current || !imageData) {
      return;
    }

    const rect = imageAreaRef.current.getBoundingClientRect();
    const x = clampPercentage(((event.clientX - rect.left) / rect.width) * 100);
    const y = clampPercentage(((event.clientY - rect.top) / rect.height) * 100);

    setPendingTag({ x, y });
    setPendingLabel('');
    setError('');
  };

  const addTag = () => {
    if (!pendingTag) {
      return;
    }

    const label = pendingLabel.trim();
    if (!label) {
      setError('Enter a label before saving the tag.');
      return;
    }

    setTags((currentTags) => [
      ...currentTags,
      {
        id: createId('tag'),
        x: pendingTag.x,
        y: pendingTag.y,
        label,
      },
    ]);
    setPendingTag(null);
    setPendingLabel('');
    setError('');
  };

  const updateTagLabel = (tagId, label) => {
    setTags((currentTags) =>
      currentTags.map((tag) => (tag.id === tagId ? { ...tag, label } : tag))
    );
  };

  const deleteTag = (tagId) => {
    setTags((currentTags) => currentTags.filter((tag) => tag.id !== tagId));
  };

  const handleSave = () => {
    if (isProcessingImage) {
      setError('Wait for image processing to finish before saving.');
      return;
    }

    if (isSaving) {
      setError('Saving is already in progress.');
      return;
    }

    const trimmedTitle = title.trim();
    if (!trimmedTitle || !imageData) {
      setError('Add a title and upload an image before saving.');
      return;
    }

    onSave({
      id: initialModule?.id ?? createId('module'),
      title: trimmedTitle,
      imageData,
      tags: tags
        .map((tag) => ({ ...tag, label: tag.label.trim() }))
        .filter((tag) => tag.label),
    });
  };

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_380px]">
      <div className="rounded-[2rem] border border-slate-800/90 bg-slate-900/70 p-5 shadow-glow">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-teal">
              {initialModule ? 'Edit Mode' : 'Create Mode'}
            </p>
            <h2 className="mt-2 font-display text-3xl text-white">
              {initialModule ? 'Refine your study module' : 'Create a new study module'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_240px] md:items-end">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-200">Module Title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Human kidney, heart chambers, leaf anatomy..."
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-4 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-teal"
            />
          </label>

          <label
            className={`flex h-[58px] items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 px-5 text-sm font-medium text-white transition ${
              isProcessingImage
                ? 'cursor-wait opacity-70'
                : 'cursor-pointer hover:border-teal hover:bg-slate-950/80'
            }`}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-teal/20 bg-teal/10 text-teal">
              <ImagePlus className="h-5 w-5" />
            </span>
            <span className="text-base">
              {isProcessingImage ? 'Processing Image...' : 'Upload Image'}
            </span>
            <input
              type="file"
              accept="image/*,.heic,.heif,image/heic,image/heif"
              onChange={handleImageUpload}
              disabled={isProcessingImage}
              className="hidden"
            />
          </label>
        </div>

        <div className="relative mt-6">
          {imageData ? (
            <div
              ref={imageAreaRef}
              onClick={handleImageClick}
              className="relative cursor-crosshair overflow-visible"
            >
              <div className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950">
                <img
                  src={imageData}
                  alt={title || 'Study diagram'}
                  className="block h-auto w-full"
                />
              </div>

              {tags.map((tag, index) => (
                <TagPin key={tag.id} tag={tag} index={index} />
              ))}

              {pendingTag ? (
                <div
                  className="absolute z-30 w-64 -translate-x-1/2 rounded-3xl border border-slate-700 bg-slate-950/95 p-4 shadow-2xl backdrop-blur"
                  style={{
                    left: `${pendingTag.x}%`,
                    top: `${Math.min(88, pendingTag.y + 3)}%`,
                  }}
                  onClick={(event) => event.stopPropagation()}
                >
                  <p className="text-xs uppercase tracking-[0.25em] text-gold">New Tag</p>
                  <input
                    ref={popoverInputRef}
                    value={pendingLabel}
                    onChange={(event) => setPendingLabel(event.target.value)}
                    placeholder="Enter part name"
                    className="mt-3 w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-teal"
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        addTag();
                      }
                    }}
                  />
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setPendingTag(null);
                        setPendingLabel('');
                        setError('');
                      }}
                      className="rounded-full px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={addTag}
                      className="rounded-full bg-teal px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-teal/90"
                    >
                      Add Tag
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex h-[420px] flex-col items-center justify-center px-6 text-center text-slate-400">
              <MapPinned className="h-12 w-12 text-slate-600" />
              <p className="mt-4 font-display text-2xl text-slate-200">Upload a diagram to start tagging</p>
              <p className="mt-2 max-w-md text-sm leading-6">
                Pins are stored using percentage coordinates, so they remain aligned even when the image is resized.
              </p>
            </div>
          )}
        </div>

        {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-400">
            Click directly on the image to place a pin, then label it in the popover.
          </p>
          <button
            type="button"
            onClick={handleSave}
            disabled={isProcessingImage || isSaving}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-3 font-semibold text-slate-950 transition ${
              isProcessingImage || isSaving
                ? 'cursor-not-allowed bg-coral/60'
                : 'bg-coral hover:bg-coral/90'
            }`}
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Module'}
          </button>
        </div>
      </div>

      <aside className="rounded-[2rem] border border-slate-800/90 bg-slate-900/70 p-5 shadow-glow">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-gold">Tag List</p>
            <h3 className="mt-2 font-display text-2xl text-white">{tags.length} labeled structures</h3>
          </div>
          <PencilLine className="h-5 w-5 text-gold" />
        </div>

        <div className="mt-5 space-y-3">
          {tags.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/50 p-5 text-sm text-slate-400">
              No tags yet. Upload an image and click on the diagram to add the first pin.
            </div>
          ) : null}

          {tags.map((tag, index) => (
            <div key={tag.id} className="rounded-3xl border border-slate-800 bg-slate-950/75 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-coral text-xs font-bold text-slate-950">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <label className="block text-xs uppercase tracking-[0.2em] text-slate-500">Label</label>
                  <input
                    value={tag.label}
                    onChange={(event) => updateTagLabel(tag.id, event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-teal"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => deleteTag(tag.id)}
                  className="rounded-full p-2 text-rose-300 transition hover:bg-rose-500/10 hover:text-rose-200"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </section>
  );
}
