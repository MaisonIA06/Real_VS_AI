import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, X, Check, Upload, Image, Video, Volume2 } from 'lucide-react';
import { adminApi, MediaPairAdmin, Category } from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';

export default function AdminMediaPairs() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    category: '',
    media_type: 'image',
    difficulty: 'medium',
    hint: '',
    real_media: null as File | null,
    ai_media: null as File | null,
    audio_media: null as File | null,
    is_real: true,
  });
  const [filters, setFilters] = useState({
    category: '',
    media_type: '',
    difficulty: '',
  });

  const { data: categories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => adminApi.getCategories().then((res) => {
      // Gérer la pagination : extraire results si c'est un objet paginé
      return Array.isArray(res.data) ? res.data : (res.data.results || res.data);
    }),
  });

  const { data: pairs, isLoading } = useQuery({
    queryKey: ['admin-pairs', filters],
    queryFn: () =>
      adminApi
        .getMediaPairs({
          category: filters.category ? parseInt(filters.category) : undefined,
          media_type: filters.media_type || undefined,
          difficulty: filters.difficulty || undefined,
        })
        .then((res) => {
          // Gérer la pagination : extraire results si c'est un objet paginé
          return Array.isArray(res.data) ? res.data : (res.data.results || res.data);
        }),
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => adminApi.createMediaPair(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pairs'] });
      setIsAdding(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteMediaPair(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pairs'] });
    },
  });

  const resetForm = () => {
    setFormData({
      category: '',
      media_type: 'image',
      difficulty: 'medium',
      hint: '',
      real_media: null,
      ai_media: null,
      audio_media: null,
      is_real: true,
    });
  };

  const handleSubmit = () => {
    if (!formData.category) {
      alert('Veuillez sélectionner une catégorie');
      return;
    }

    if (formData.media_type === 'audio') {
      if (!formData.audio_media) {
        alert('Veuillez uploader un fichier audio');
        return;
      }
    } else {
      if (!formData.real_media || !formData.ai_media) {
        alert('Veuillez uploader les deux fichiers (réel et IA)');
        return;
      }
    }

    const data = new FormData();
    data.append('category', formData.category);
    data.append('media_type', formData.media_type);
    data.append('difficulty', formData.difficulty);
    data.append('hint', formData.hint);
    
    if (formData.media_type === 'audio') {
      data.append('audio_media', formData.audio_media);
      data.append('is_real', formData.is_real.toString());
    } else {
      data.append('real_media', formData.real_media!);
      data.append('ai_media', formData.ai_media!);
    }
    
    data.append('is_active', 'true');

    createMutation.mutate(data);
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-500/20 text-green-400';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'hard':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-dark-700 text-dark-400';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2">Paires de médias</h1>
            <p className="text-dark-400">Gérez les paires réel/IA</p>
          </div>
          <button
            onClick={() => {
              setIsAdding(true);
              resetForm();
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Ajouter
          </button>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="input-styled"
            >
              <option value="">Toutes les catégories</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <select
              value={filters.media_type}
              onChange={(e) => setFilters({ ...filters, media_type: e.target.value })}
              className="input-styled"
            >
              <option value="">Tous les types</option>
              <option value="image">Image</option>
              <option value="video">Vidéo</option>
              <option value="audio">Audio</option>
            </select>
            <select
              value={filters.difficulty}
              onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
              className="input-styled"
            >
              <option value="">Toutes les difficultés</option>
              <option value="easy">Facile</option>
              <option value="medium">Moyen</option>
              <option value="hard">Difficile</option>
            </select>
          </div>
        </div>

        {/* Add Form */}
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <h3 className="font-display text-lg font-semibold mb-4">
              Nouvelle paire
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-dark-400 mb-2">Catégorie *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input-styled"
                >
                  <option value="">Sélectionner...</option>
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-dark-400 mb-2">Type de média</label>
                <select
                  value={formData.media_type}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setFormData({ 
                      ...formData, 
                      media_type: newType,
                      // Reset files when changing type
                      real_media: null,
                      ai_media: null,
                      audio_media: null,
                    });
                  }}
                  className="input-styled"
                >
                  <option value="image">Image</option>
                  <option value="video">Vidéo</option>
                  <option value="audio">Audio</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-dark-400 mb-2">Difficulté</label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  className="input-styled"
                >
                  <option value="easy">Facile</option>
                  <option value="medium">Moyen</option>
                  <option value="hard">Difficile</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-dark-400 mb-2">Indice (après réponse)</label>
                <input
                  type="text"
                  value={formData.hint}
                  onChange={(e) => setFormData({ ...formData, hint: e.target.value })}
                  placeholder="Ex: Les reflets dans les yeux sont souvent un indice..."
                  className="input-styled"
                />
              </div>
            </div>

            {/* File uploads */}
            {formData.media_type === 'audio' ? (
              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm text-dark-400 mb-2">Fichier audio *</label>
                  <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-dark-600 rounded-xl cursor-pointer hover:border-primary-500 transition-colors">
                    {formData.audio_media ? (
                      <span className="text-green-400">{formData.audio_media.name}</span>
                    ) : (
                      <>
                        <Volume2 className="w-8 h-8 text-dark-500 mb-2" />
                        <span className="text-dark-500">Cliquez pour uploader un fichier audio</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) =>
                        setFormData({ ...formData, audio_media: e.target.files?.[0] || null })
                      }
                      className="hidden"
                    />
                  </label>
                </div>
                <div>
                  <label className="block text-sm text-dark-400 mb-2">Type d'audio</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="is_real"
                        checked={formData.is_real === true}
                        onChange={() => setFormData({ ...formData, is_real: true })}
                        className="w-4 h-4 text-primary-500"
                      />
                      <span>Réel</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="is_real"
                        checked={formData.is_real === false}
                        onChange={() => setFormData({ ...formData, is_real: false })}
                        className="w-4 h-4 text-primary-500"
                      />
                      <span>IA</span>
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-dark-400 mb-2">Média RÉEL *</label>
                  <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-dark-600 rounded-xl cursor-pointer hover:border-primary-500 transition-colors">
                    {formData.real_media ? (
                      <span className="text-green-400">{formData.real_media.name}</span>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-dark-500 mb-2" />
                        <span className="text-dark-500">Cliquez pour uploader</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept={formData.media_type === 'image' ? 'image/*' : 'video/*'}
                      onChange={(e) =>
                        setFormData({ ...formData, real_media: e.target.files?.[0] || null })
                      }
                      className="hidden"
                    />
                  </label>
                </div>
                <div>
                  <label className="block text-sm text-dark-400 mb-2">Média IA *</label>
                  <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-dark-600 rounded-xl cursor-pointer hover:border-primary-500 transition-colors">
                    {formData.ai_media ? (
                      <span className="text-green-400">{formData.ai_media.name}</span>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-dark-500 mb-2" />
                        <span className="text-dark-500">Cliquez pour uploader</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept={formData.media_type === 'image' ? 'image/*' : 'video/*'}
                      onChange={(e) =>
                        setFormData({ ...formData, ai_media: e.target.files?.[0] || null })
                      }
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={createMutation.isPending}
                className="btn-primary px-6"
              >
                <Check className="w-4 h-4 inline mr-2" />
                {createMutation.isPending ? 'Envoi...' : 'Créer'}
              </button>
              <button onClick={() => setIsAdding(false)} className="btn-secondary px-6">
                <X className="w-4 h-4 inline mr-2" />
                Annuler
              </button>
            </div>
          </motion.div>
        )}

        {/* Pairs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full flex justify-center py-12">
              <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
            </div>
          ) : pairs && pairs.length > 0 ? (
            pairs.map((pair) => (
              <motion.div
                key={pair.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card overflow-hidden"
              >
                {/* Media preview */}
                {pair.media_type === 'audio' ? (
                  <div className="mb-4">
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-dark-800 flex items-center justify-center">
                      <Volume2 className="w-16 h-16 text-primary-400" />
                      <span className={`absolute bottom-1 left-1 px-2 py-0.5 rounded text-xs font-bold ${
                        pair.is_real ? 'bg-green-500/80' : 'bg-red-500/80'
                      }`}>
                        {pair.is_real ? 'RÉEL' : 'IA'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-dark-800">
                      {pair.media_type === 'image' ? (
                        <img
                          src={pair.real_media}
                          alt="Real"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video src={pair.real_media} className="w-full h-full object-cover" muted />
                      )}
                      <span className="absolute bottom-1 left-1 px-2 py-0.5 rounded bg-green-500/80 text-xs font-bold">
                        RÉEL
                      </span>
                    </div>
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-dark-800">
                      {pair.media_type === 'image' ? (
                        <img
                          src={pair.ai_media}
                          alt="AI"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video src={pair.ai_media} className="w-full h-full object-cover" muted />
                      )}
                      <span className="absolute bottom-1 left-1 px-2 py-0.5 rounded bg-red-500/80 text-xs font-bold">
                        IA
                      </span>
                    </div>
                  </div>
                )}

                {/* Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-full bg-dark-700 text-sm">
                      {pair.category_name}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-sm ${getDifficultyBadge(pair.difficulty)}`}>
                      {pair.difficulty === 'easy' ? 'Facile' : pair.difficulty === 'medium' ? 'Moyen' : 'Difficile'}
                    </span>
                    {pair.media_type === 'video' && (
                      <Video className="w-4 h-4 text-dark-400" />
                    )}
                    {pair.media_type === 'audio' && (
                      <Volume2 className="w-4 h-4 text-dark-400" />
                    )}
                  </div>

                  {pair.hint && (
                    <p className="text-sm text-dark-400 line-clamp-2">{pair.hint}</p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-dark-500">
                    <span>{pair.stats.total_attempts} essais</span>
                    <span>{pair.stats.success_rate}% de réussite</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-dark-700">
                  <button
                    onClick={() => {
                      if (confirm('Supprimer cette paire ?')) {
                        deleteMutation.mutate(pair.id);
                      }
                    }}
                    className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center text-dark-400 py-12">
              Aucune paire de médias. Créez-en une pour commencer.
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

