import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, X, Check, Shuffle, List } from 'lucide-react';
import { adminApi, QuizAdmin, MediaPairAdmin } from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';

export default function AdminQuizzes() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_random: false,
    pair_ids: [] as number[],
  });

  const { data: quizzes, isLoading } = useQuery({
    queryKey: ['admin-quizzes'],
    queryFn: () => adminApi.getQuizzes().then((res) => {
      // Gérer la pagination : extraire results si c'est un objet paginé
      return Array.isArray(res.data) ? res.data : (res.data.results || res.data);
    }),
  });

  const { data: pairs } = useQuery({
    queryKey: ['admin-pairs'],
    queryFn: () => adminApi.getMediaPairs().then((res) => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => adminApi.createQuiz(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-quizzes'] });
      setIsAdding(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: typeof formData }) =>
      adminApi.updateQuiz(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-quizzes'] });
      setEditingId(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteQuiz(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-quizzes'] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      is_random: false,
      pair_ids: [],
    });
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      alert('Veuillez donner un nom au quiz');
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const startEdit = (quiz: QuizAdmin) => {
    setEditingId(quiz.id);
    setFormData({
      name: quiz.name,
      description: quiz.description,
      is_random: quiz.is_random,
      pair_ids: quiz.quiz_pairs?.map((qp) => qp.media_pair) || [],
    });
  };

  const togglePair = (pairId: number) => {
    if (formData.pair_ids.includes(pairId)) {
      setFormData({
        ...formData,
        pair_ids: formData.pair_ids.filter((id) => id !== pairId),
      });
    } else {
      setFormData({
        ...formData,
        pair_ids: [...formData.pair_ids, pairId],
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2">Quiz</h1>
            <p className="text-dark-400">Créez des quiz personnalisés</p>
          </div>
          <button
            onClick={() => {
              setIsAdding(true);
              resetForm();
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Créer un quiz
          </button>
        </div>

        {/* Add/Edit Form */}
        {(isAdding || editingId) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <h3 className="font-display text-lg font-semibold mb-4">
              {editingId ? 'Modifier le quiz' : 'Nouveau quiz'}
            </h3>
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-dark-400 mb-2">Nom *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Paysages naturels"
                    className="input-styled"
                  />
                </div>
                <div>
                  <label className="block text-sm text-dark-400 mb-2">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Ex: Testez votre œil sur des paysages"
                    className="input-styled"
                  />
                </div>
              </div>

              {/* Random mode toggle */}
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_random}
                    onChange={(e) => setFormData({ ...formData, is_random: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-dark-700 rounded-full peer peer-checked:bg-primary-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
                <div>
                  <span className="font-medium flex items-center gap-2">
                    <Shuffle className="w-4 h-4" />
                    Mode aléatoire
                  </span>
                  <p className="text-sm text-dark-400">
                    Pioche 10 paires au hasard parmi toutes les paires actives
                  </p>
                </div>
              </div>

              {/* Pair selection (only if not random) */}
              {!formData.is_random && (
                <div>
                  <label className="block text-sm text-dark-400 mb-2">
                    Sélectionnez les paires ({formData.pair_ids.length} sélectionnées)
                  </label>
                  <div className="max-h-64 overflow-y-auto border border-dark-700 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                    {pairs?.map((pair) => (
                      <div
                        key={pair.id}
                        onClick={() => togglePair(pair.id)}
                        className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                          formData.pair_ids.includes(pair.id)
                            ? 'border-primary-500'
                            : 'border-transparent hover:border-dark-600'
                        }`}
                      >
                        <img
                          src={pair.real_media}
                          alt={`Pair ${pair.id}`}
                          className="w-full aspect-square object-cover"
                        />
                        {formData.pair_ids.includes(pair.id) && (
                          <div className="absolute inset-0 bg-primary-500/30 flex items-center justify-center">
                            <Check className="w-8 h-8 text-white" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-dark-900/80 px-2 py-1 text-xs">
                          {pair.category_name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="btn-primary px-6"
              >
                <Check className="w-4 h-4 inline mr-2" />
                {editingId ? 'Enregistrer' : 'Créer'}
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

        {/* Quizzes List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full flex justify-center py-12">
              <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
            </div>
          ) : quizzes && quizzes.length > 0 ? (
            quizzes.map((quiz) => (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-display text-lg font-semibold">{quiz.name}</h3>
                    {quiz.description && (
                      <p className="text-sm text-dark-400 mt-1">{quiz.description}</p>
                    )}
                  </div>
                  {quiz.is_random ? (
                    <Shuffle className="w-5 h-5 text-primary-400" />
                  ) : (
                    <List className="w-5 h-5 text-accent-400" />
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-dark-400 mb-4">
                  <span>
                    {quiz.is_random ? 'Aléatoire' : `${quiz.pairs_count} paires`}
                  </span>
                  <span>{quiz.sessions_count} sessions</span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      quiz.is_active
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-dark-700 text-dark-400'
                    }`}
                  >
                    {quiz.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </div>

                <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-dark-700">
                  <button
                    onClick={() => startEdit(quiz)}
                    className="p-2 rounded-lg bg-dark-700 text-dark-400 hover:bg-dark-600 hover:text-white"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Supprimer ce quiz ?')) {
                        deleteMutation.mutate(quiz.id);
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
              Aucun quiz. Créez-en un pour commencer.
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

