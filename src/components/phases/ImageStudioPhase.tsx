import React, { useState, useEffect } from 'react';
import { Image, Sparkles, Download, Trash2, Play, Wand2 } from 'lucide-react';
import { api } from '../../services/api';
import { ImageItem } from '../../types';

export const ImageStudioPhase: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [prompt, setPrompt] = useState('Cyberpunk neon holographic dashboard interface with glassmorphic cards');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      const res = await api.getImages();
      setImages(res.images || []);
    } catch (err) {
      console.error('Failed to load images', err);
    }
  };

  const handleEnhance = async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    try {
      const res = await api.enhancePrompt(prompt.trim());
      setPrompt(res.enhancedPrompt);
    } catch (err: any) {
      alert(`Prompt enhancement failed: ${err.message}`);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      const res = await api.generateImage(prompt.trim(), aspectRatio, true);
      setImages((prev) => [res.image, ...prev]);
    } catch (err: any) {
      alert(`Image generation failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteImage(id);
      setImages((prev) => prev.filter((img) => img.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Header & Controls */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-pink-600 text-white flex items-center justify-center">
              <Image className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900 leading-tight">Image Studio</h2>
              <p className="text-[11px] text-slate-500">Prompt Enhancement, Aspect Ratios & Vector Art Generation</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleGenerate} className="space-y-2">
          <div className="flex gap-2">
            <input
              id="input-image-prompt"
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image or visual asset to generate..."
              className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-pink-500"
            />
            <button
              type="button"
              onClick={handleEnhance}
              disabled={isEnhancing || !prompt.trim()}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-pink-50 text-pink-700 hover:bg-pink-100 border border-pink-200 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>{isEnhancing ? 'Enhancing...' : 'Enhance Prompt'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600">Aspect Ratio:</span>
              {['1:1', '16:9', '9:16'].map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => setAspectRatio(ratio)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                    aspectRatio === ratio
                      ? 'bg-pink-600 text-white border-pink-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>

            <button
              id="btn-image-generate"
              type="submit"
              disabled={isGenerating || !prompt.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50"
            >
              <Play className="w-3 h-3" />
              <span>{isGenerating ? 'Synthesizing...' : 'Generate Image'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Image Gallery */}
      <div className="flex-1 p-4 overflow-y-auto bg-slate-50/50">
        {images.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center">
            <Image className="w-12 h-12 mb-2 opacity-30" />
            <p className="text-xs">No images created yet. Enter a prompt above to generate visual art.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((img) => (
              <div
                key={img.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs group flex flex-col justify-between"
              >
                <div className="relative aspect-video bg-slate-900 flex items-center justify-center overflow-hidden">
                  <img
                    src={img.imageUrl}
                    alt={img.prompt}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={img.imageUrl}
                      download={`princeai_${img.id}.svg`}
                      className="p-1.5 bg-white/90 rounded-lg text-slate-700 hover:text-slate-900 shadow-sm"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => handleDelete(img.id)}
                      className="p-1.5 bg-white/90 rounded-lg text-red-600 hover:text-red-700 shadow-sm"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-3 space-y-1">
                  <p className="text-xs font-medium text-slate-800 line-clamp-2">{img.prompt}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 font-mono">
                    <span>Ratio: {img.aspectRatio}</span>
                    <span>{new Date(img.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
