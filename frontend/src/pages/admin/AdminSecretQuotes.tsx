import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, X, Check, Upload, Quote, Sparkles, GripVertical, Eye, EyeOff } from 'lucide-react';
import { adminApi, SecretQuoteAdmin } from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';

export default function AdminSecretQuotes() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    quote: '',
    hint: '',
    author_name: '',
    author_image: null as File | null,
    is_active: true,
    order: 0,
  });

  const { data: quotes, isLoading } = useQuery({
    queryKey: ['admin-secret-quotes'],
    queryFn: () =>
      adminApi.getSecretQuotes().then((res) => {
        return Array.isArray(res.data) ? res.data : (res.data.results || res.data);
      }),
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => adminApi.createSecretQuote(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-secret-quotes'] });
      setIsAdding(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) =>
      adminApi.updateSecretQuote(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-secret-quotes'] });
      setEditingId(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteSecretQuote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-secret-quotes'] });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) => {
      const formData = new FormData();
      formData.append('is_active', String(is_active));
      return adminApi.updateSecretQuote(id, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-secret-quotes'] });
    },
  });

  const resetForm = () => {
    setFormData({
      quote: '',
      hint: '',
      author_name: '',
      author_image: null,
      is_active: true,
      order: 0,
    });
  };

  const handleSubmit = () => {
    if (!formData.quote.trim()) {
      alert('Veuillez entrer une citation');
      return;
    }
    if (!formData.author_name.trim()) {
      alert('Veuillez entrer le nom de l\'auteur');
      return;
    }
    if (!editingId && !formData.author_image) {
      alert('Veuillez uploader une image de l\'auteur');
      return;
    }

    const data = new FormData();
    data.append('quote', formData.quote);
    data.append('hint', formData.hint);
    data.append('author_name', formData.author_name);
    data.append('is_active', String(formData.is_active));
    data.append('order', String(formData.order));
    
    if (formData.author_image) {
      data.append('author_image', formData.author_image);
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const startEditing = (quote: SecretQuoteAdmin) => {
    setEditingId(quote.id);
    setFormData({
      quote: quote.quote,
      hint: quote.hint,
      author_name: quote.author_name,
      author_image: null,
      is_active: quote.is_active,
      order: quote.order,
    });
    setIsAdding(true);
  };

  const activeCount = quotes?.filter((q) => q.is_active).length || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-8 h-8 text-amber-400" />
              <h1 className="font-display text-3xl font-bold">Quiz Secret</h1>
            </div>
            <p className="text-dark-400">
              Gérez les citations de l'easter egg • {activeCount} citation{activeCount !== 1 ? 's' : ''} active{activeCount !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => {
              setIsAdding(true);
              setEditingId(null);
              resetForm();
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Ajouter
          </button>
        </div>

        {/* Info card */}
        <div className="card bg-gradient-to-r from-amber-500/10 to-purple-500/10 border-amber-500/30">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
              <Quote className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-400 mb-1">Comment ça fonctionne ?</h3>
              <p className="text-dark-300 text-sm">
                Les utilisateurs peuvent déclencher ce quiz secret en cliquant sur la page d'accueil dans l'ordre : 
                <strong className="text-white"> 1× "10 Défis" → 3× "Streak Bonus" → 2× "Classement"</strong>.
                Chaque citation sera affichée avec toutes les images d'auteurs mélangées - le joueur doit trouver le bon auteur !
              </p>
            </div>
          </div>
        </div>

        {/* Add/Edit Form */}
        <AnimatePresence>
          {isAdding && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="card"
            >
              <h3 className="font-display text-lg font-semibold mb-4">
                {editingId ? 'Modifier la citation' : 'Nouvelle citation'}
              </h3>
              
              <div className="space-y-4">
                {/* Citation */}
                <div>
                  <label className="block text-sm text-dark-400 mb-2">Citation *</label>
                  <textarea
                    value={formData.quote}
                    onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                    placeholder="Ex: L'imagination est plus importante que le savoir."
                    className="input-styled min-h-[100px] resize-y"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Auteur */}
                  <div>
                    <label className="block text-sm text-dark-400 mb-2">Nom de l'auteur *</label>
                    <input
                      type="text"
                      value={formData.author_name}
                      onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                      placeholder="Ex: Albert Einstein"
                      className="input-styled"
                    />
                  </div>

                  {/* Indice */}
                  <div>
                    <label className="block text-sm text-dark-400 mb-2">Indice (optionnel)</label>
                    <input
                      type="text"
                      value={formData.hint}
                      onChange={(e) => setFormData({ ...formData, hint: e.target.value })}
                      placeholder="Ex: Un génie de la physique"
                      className="input-styled"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Image */}
                  <div>
                    <label className="block text-sm text-dark-400 mb-2">
                      Photo de l'auteur {!editingId && '*'}
                    </label>
                    <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-dark-600 rounded-xl cursor-pointer hover:border-amber-500 transition-colors">
                      {formData.author_image ? (
                        <span className="text-green-400">{formData.author_image.name}</span>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-dark-500 mb-2" />
                          <span className="text-dark-500 text-sm">
                            {editingId ? 'Changer l\'image' : 'Cliquez pour uploader'}
                          </span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setFormData({ ...formData, author_image: e.target.files?.[0] || null })
                        }
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Options */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-dark-400 mb-2">Ordre d'affichage</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.order}
                        onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                        className="input-styled"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="is_active"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-5 h-5 rounded border-dark-600 bg-dark-800 text-amber-500 focus:ring-amber-500"
                      />
                      <label htmlFor="is_active" className="text-sm">
                        Citation active
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="btn-primary px-6"
                >
                  <Check className="w-4 h-4 inline mr-2" />
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Envoi...'
                    : editingId
                    ? 'Mettre à jour'
                    : 'Créer'}
                </button>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setEditingId(null);
                    resetForm();
                  }}
                  className="btn-secondary px-6"
                >
                  <X className="w-4 h-4 inline mr-2" />
                  Annuler
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quotes List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
            </div>
          ) : quotes && quotes.length > 0 ? (
            quotes.map((quote, index) => (
              <motion.div
                key={quote.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`card flex gap-4 ${!quote.is_active ? 'opacity-60' : ''}`}
              >
                {/* Drag handle & Order */}
                <div className="flex flex-col items-center justify-center text-dark-500">
                  <GripVertical className="w-5 h-5 mb-1" />
                  <span className="text-xs font-mono">#{quote.order}</span>
                </div>

                {/* Author image */}
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-dark-800 shrink-0">
                  {quote.author_image ? (
                    <img
                      src={quote.author_image}
                      alt={quote.author_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-dark-600">
                      <Quote className="w-8 h-8" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-lg italic text-white mb-2 line-clamp-2">
                    "{quote.quote}"
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-amber-400 font-semibold">— {quote.author_name}</span>
                    {quote.hint && (
                      <span className="text-dark-500">💡 {quote.hint}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleActiveMutation.mutate({ id: quote.id, is_active: !quote.is_active })}
                    className={`p-2 rounded-lg transition-colors ${
                      quote.is_active
                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        : 'bg-dark-700 text-dark-400 hover:bg-dark-600'
                    }`}
                    title={quote.is_active ? 'Désactiver' : 'Activer'}
                  >
                    {quote.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => startEditing(quote)}
                    className="p-2 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Supprimer cette citation ?')) {
                        deleteMutation.mutate(quote.id);
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
            <div className="text-center text-dark-400 py-12">
              <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucune citation pour l'instant.</p>
              <p className="text-sm mt-2">Créez-en une pour activer le quiz secret !</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

