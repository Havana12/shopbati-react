'use client'

import { useEffect, useState } from 'react'
import { AppwriteService } from '@/lib/appwrite'

interface AdminUser {
  $id: string
  username: string
  email: string
  role: string
  status: string
  created_at: string
  last_login: string | null
}

export default function AdminSettingsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'admin',
    status: 'active'
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitLoading, setSubmitLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    fetchAdmins()
  }, [])

  const fetchAdmins = async () => {
    try {
      setLoading(true)
      const appwrite = AppwriteService.getInstance()
      const result = await appwrite.getAdminUsers([
        appwrite.Query.orderDesc('created_at')
      ])
      setAdmins(result.documents as unknown as AdminUser[])
    } catch (error) {
      console.error('Error fetching admins:', error)
      setErrorMessage('Erreur lors du chargement des administrateurs')
    } finally {
      setLoading(false)
    }
  }

  const openModal = (admin?: AdminUser) => {
    if (admin) {
      setEditingAdmin(admin)
      setFormData({
        username: admin.username,
        email: admin.email,
        password: '',
        confirmPassword: '',
        role: admin.role,
        status: admin.status
      })
    } else {
      setEditingAdmin(null)
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'admin',
        status: 'active'
      })
    }
    setFormErrors({})
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingAdmin(null)
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'admin',
      status: 'active'
    })
    setFormErrors({})
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.username.trim()) {
      errors.username = 'Le nom d\'utilisateur est requis'
    }

    if (!formData.email.trim()) {
      errors.email = 'L\'email est requis'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email invalide'
    }

    if (!editingAdmin) {
      // For new admin, password is required
      if (!formData.password) {
        errors.password = 'Le mot de passe est requis'
      } else if (formData.password.length < 8) {
        errors.password = 'Le mot de passe doit contenir au moins 8 caractères'
      }
    } else {
      // For editing, password is optional but if provided, must be valid
      if (formData.password && formData.password.length < 8) {
        errors.password = 'Le mot de passe doit contenir au moins 8 caractères'
      }
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setSubmitLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const appwrite = AppwriteService.getInstance()

      if (editingAdmin) {
        // Update existing admin
        const updateData: any = {
          username: formData.username,
          email: formData.email,
          role: formData.role,
          status: formData.status
        }

        if (formData.password) {
          updateData.password = formData.password
        }

        await appwrite.updateAdminUser(editingAdmin.$id, updateData)
        setSuccessMessage('Administrateur mis à jour avec succès')
      } else {
        // Create new admin
        await appwrite.createAdminUser({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          status: formData.status
        })
        setSuccessMessage('Administrateur créé avec succès')
      }

      await fetchAdmins()
      closeModal()

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error: any) {
      console.error('Error saving admin:', error)
      setErrorMessage(error.message || 'Erreur lors de l\'enregistrement')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleDelete = async (admin: AdminUser) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'administrateur "${admin.name}" ?`)) {
      return
    }

    // Check if this is the only active admin
    const activeAdmins = admins.filter(a => a.status === 'active')
    if (activeAdmins.length === 1 && admin.status === 'active') {
      setErrorMessage('Impossible de supprimer le dernier administrateur actif')
      setTimeout(() => setErrorMessage(''), 3000)
      return
    }

    try {
      const appwrite = AppwriteService.getInstance()
      await appwrite.deleteAdminUser(admin.$id)
      setSuccessMessage('Administrateur supprimé avec succès')
      await fetchAdmins()
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error: any) {
      console.error('Error deleting admin:', error)
      setErrorMessage(error.message || 'Erreur lors de la suppression')
      setTimeout(() => setErrorMessage(''), 3000)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Jamais'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
          <p className="text-gray-600 mt-2">Gérer les administrateurs du système</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <i className="fas fa-plus mr-2"></i>
          Ajouter un administrateur
        </button>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center">
          <i className="fas fa-check-circle mr-2"></i>
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <i className="fas fa-exclamation-circle mr-2"></i>
          {errorMessage}
        </div>
      )}

      {/* Admins List */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Administrateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dernière connexion
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {admins.map((admin) => (
                <tr key={admin.$id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                        {admin.username?.charAt(0)?.toUpperCase() || 'A'}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{admin.username || 'Sans nom'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{admin.email || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      admin.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {admin.status === 'active' ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(admin.last_login)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openModal(admin)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                      title="Modifier"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      onClick={() => handleDelete(admin)}
                      className="text-red-600 hover:text-red-900"
                      title="Supprimer"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {admins.length === 0 && (
          <div className="text-center py-12">
            <i className="fas fa-users text-gray-400 text-5xl mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun administrateur</h3>
            <p className="text-gray-600">Commencez par ajouter un administrateur</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingAdmin ? 'Modifier l\'administrateur' : 'Nouvel administrateur'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom d'utilisateur <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.username ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="admin"
                />
                {formErrors.username && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.username}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="admin@shopbati.fr"
                />
                {formErrors.email && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe {!editingAdmin && <span className="text-red-500">*</span>}
                  {editingAdmin && <span className="text-gray-500 text-xs">(laisser vide pour ne pas changer)</span>}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="••••••••"
                />
                {formErrors.password && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmer le mot de passe {!editingAdmin && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="••••••••"
                />
                {formErrors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.confirmPassword}</p>
                )}
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rôle <span className="text-red-500">*</span>
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={submitLoading}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300"
                  disabled={submitLoading}
                >
                  {submitLoading ? (
                    <span className="flex items-center justify-center">
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Enregistrement...
                    </span>
                  ) : (
                    editingAdmin ? 'Mettre à jour' : 'Créer'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
