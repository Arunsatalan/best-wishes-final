"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Image as ImageIcon } from "lucide-react"
import Image from "next/image"

// HeroSection shape for reference:
// {
//   _id: string,
//   image: string,
//   title: string,
//   description: string,
//   isActive: boolean,
//   order?: number
// }

export default function SliderManagement() {
  const [slides, setSlides] = useState([])
  const [loading, setLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSlide, setEditingSlide] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState("")
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isActive: true,
    order: 0
  })

  useEffect(() => {
    fetchHeroSections()
  }, [])

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL_2 || 'https://best-wishes-final-production-e20b.up.railway.app';

  const fetchHeroSections = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/api/hero-sections`, { credentials: 'include' })
      const data = await response.json()
      if (data.success) {
        setSlides(data.data)
      }
    } catch (error) {
      console.error('Error fetching hero sections:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(typeof reader.result === 'string' ? reader.result : '')
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!editingSlide && !imageFile) {
      alert('Please select an image')
      return
    }
    const formDataToSend = new FormData()
    formDataToSend.append('title', formData.title)
    formDataToSend.append('description', formData.description)
    formDataToSend.append('isActive', String(formData.isActive))
    formDataToSend.append('order', String(formData.order))
    if (imageFile) {
      formDataToSend.append('image', imageFile)
    }
    try {
      setLoading(true)
      const url = editingSlide ? `${API_BASE_URL}/api/hero-sections/${editingSlide._id}` : `${API_BASE_URL}/api/hero-sections`
      const method = editingSlide ? 'PUT' : 'POST'
      const response = await fetch(url, {
        method,
        body: formDataToSend,
        credentials: 'include'
      })
      const data = await response.json()
      if (data.success) {
        await fetchHeroSections()
        setIsDialogOpen(false)
        setEditingSlide(null)
        setFormData({ title: '', description: '', isActive: true, order: 0 })
        setImageFile(null)
        setImagePreview('')
      } else {
        alert(data.message || 'Error saving hero section')
      }
    } catch (error) {
      console.error('Error saving hero section:', error)
      alert('Error saving hero section')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (slide) => {
    setEditingSlide(slide)
    setFormData({
      title: slide.title,
      description: slide.description,
      isActive: slide.isActive,
      order: slide.order || 0
    })
    setImagePreview(slide.image)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this hero section?')) return
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/api/hero-sections/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      const data = await response.json()
      if (data.success) {
        await fetchHeroSections()
      } else {
        alert(data.message || 'Error deleting hero section')
      }
    } catch (error) {
      console.error('Error deleting hero section:', error)
      alert('Error deleting hero section')
    } finally {
      setLoading(false)
    }
  }

  const toggleStatus = async (id) => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/api/hero-sections/${id}/toggle-status`, {
        method: 'PATCH',
        credentials: 'include'
      })
      const data = await response.json()
      if (data.success) {
        await fetchHeroSections()
      } else {
        alert(data.message || 'Error updating hero section status')
      }
    } catch (error) {
      console.error('Error updating hero section status:', error)
      alert('Error updating hero section status')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Hero Slider Management</h2>
          <p className="text-gray-600">Manage your homepage hero slider</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Slide
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSlide ? 'Edit Slide' : 'Add New Slide'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Slide Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter slide title"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter slide description"
                  required
                />
              </div>
              <div>
                <Label htmlFor="image">Upload Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="cursor-pointer"
                />
                {imagePreview && (
                  <div className="relative w-full h-40 border rounded-lg overflow-hidden mt-2">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={loading}>
                  {loading ? 'Saving...' : (editingSlide ? 'Update' : 'Add')} Slide
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setIsDialogOpen(false)
                  setEditingSlide(null)
                  setFormData({ title: '', description: '', isActive: true, order: 0 })
                  setImageFile(null)
                  setImagePreview('')
                }} disabled={loading}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && slides.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500">Loading hero sections...</p>
          </div>
        ) : slides.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500">No hero sections found. Create your first one!</p>
          </div>
        ) : (
          slides.map((slide) => (
            <Card key={slide._id} className="overflow-hidden">
              <div className="relative h-48">
                <Image
                  src={slide.image || '/placeholder.svg'}
                  alt={slide.title || 'Hero slide'}
                  fill
                  className="object-cover"
                />
              </div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">{slide.title}</h3>
                  <Badge variant={slide.isActive ? "default" : "secondary"}>
                    {slide.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="text-gray-600 text-sm mb-4">{slide.description}</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(slide)}
                    disabled={loading}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant={slide.isActive ? "secondary" : "default"}
                    onClick={() => toggleStatus(slide._id)}
                    disabled={loading}
                  >
                    <ImageIcon className="w-4 h-4 mr-1" />
                    {slide.isActive ? "Disable" : "Enable"}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(slide._id)}
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}