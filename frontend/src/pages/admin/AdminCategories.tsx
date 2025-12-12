import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { adminApi, Category } from '../../services/api';
import AdminLayout from '../../components/admin/AdminLayout';

export default function AdminCategories() {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => adminApi.getCategories().then((res) => {
      // Gérer la pagination : extraire results si c'est un objet paginé
      return Array.isArray(res.data) ? res.data : (res.data.results || res.data);
    }),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Category>) => adminApi.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      setIsAdding(false);
      setFormData({ name: '', description: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Category> }) =>
      adminApi.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    },
  });

  const handleSubmit = () => {
    if (!formData.name.trim()) return;

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setFormData({ name: category.name, description: category.description });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2">Catégories</h1>
            <p className="text-dark-400">Gérez les catégories de médias</p>
          </div>
          <button
            onClick={() => {
              setIsAdding(true);
              setFormData({ name: '', description: '' });
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Ajouter
          </button>
        </div>

        {/* Add Form */}
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <h3 className="font-display text-lg font-semibold mb-4">
              Nouvelle catégorie
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Nom de la catégorie"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-styled"
              />
              <input
                type="text"
                placeholder="Description (optionnel)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-styled"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={handleSubmit} className="btn-primary px-6">
                <Check className="w-4 h-4 inline mr-2" />
                Créer
              </button>
              <button
                onClick={() => setIsAdding(false)}
                className="btn-secondary px-6"
              >
                <X className="w-4 h-4 inline mr-2" />
                Annuler
              </button>
            </div>
          </motion.div>
        )}

        {/* Categories List */}
        <div className="card">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
            </div>
          ) : categories && categories.length > 0 ? (
            <table className="table-admin">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Description</th>
                  <th>Paires</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td>
                      {editingId === category.id ? (
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          className="input-styled py-1"
                        />
                      ) : (
                        <span className="font-semibold">{category.name}</span>
                      )}
                    </td>
                    <td>
                      {editingId === category.id ? (
                        <input
                          type="text"
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({ ...formData, description: e.target.value })
                          }
                          className="input-styled py-1"
                        />
                      ) : (
                        <span className="text-dark-400">
                          {category.description || '-'}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="px-2 py-1 rounded-full bg-dark-700 text-sm">
                        {(category as any).pairs_count || 0}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {editingId === category.id ? (
                          <>
                            <button
                              onClick={handleSubmit}
                              className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-2 rounded-lg bg-dark-700 text-dark-400 hover:bg-dark-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(category)}
                              className="p-2 rounded-lg bg-dark-700 text-dark-400 hover:bg-dark-600 hover:text-white"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Supprimer cette catégorie ?')) {
                                  deleteMutation.mutate(category.id);
                                }
                              }}
                              className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-dark-400 py-12">
              Aucune catégorie. Créez-en une pour commencer.
            </p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

