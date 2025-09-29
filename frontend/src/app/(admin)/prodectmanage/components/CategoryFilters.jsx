"use client"

import React from "react";
import { useState, useEffect } from "react"
import { Button } from "../../../../components/ui/button"
import { Input } from "../../../../components/ui/input"
import { Label } from "../../../../components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card"
import { Badge } from "../../../../components/ui/badge"
import { Textarea } from "../../../../components/ui/textarea"
import { Plus, X, Folder, Edit2, Save, Settings, Trash2, Eye, Package, Search, Edit, Check } from "lucide-react"
import Link from "next/link"
import { Modal, useConfirmModal } from "../../../../components/ui/modal"
import { useParams } from "next/navigation"
import MediaUpload from "./MediaUpload";

export default function CategoryFilters({
  category = "",
  tags = [],
  onCategoryChange = (categoryKey) => {},
  onTagsChange = (tags) => {},
  onFiltersChange = (filters) => {},
  selectedFilters = {},
  isProductForm = false,
}) {
  const params = useParams();
  const productId = params?.id; // Now productId is defined

  const [categorySystem, setCategorySystem] = useState(/** @type {any} */ ({}))
  const [selectedMainCategory, setSelectedMainCategory] = useState(category || "")
  const [currentSelectedFilters, setCurrentSelectedFilters] = useState(selectedFilters || {})
  
  // Debug currentSelectedFilters changes
  useEffect(() => {
    console.log(" currentSelectedFilters changed:", currentSelectedFilters);
  }, [currentSelectedFilters])
  const [editingItems, setEditingItems] = useState({})
  const [newItemInputs, setNewItemInputs] = useState({})
  const [showAddInput, setShowAddInput] = useState({})
  const [showCreateCategoryForm, setShowCreateCategoryForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState(/** @type {any[]} */ ([]))
  const [filteredProducts, setFilteredProducts] = useState(/** @type {any[]} */ ([]))
  const [showProducts, setShowProducts] = useState(false)
  const [editingMainCategory, setEditingMainCategory] = useState(null)
  const [mainCategoryEditForm, setMainCategoryEditForm] = useState({ name: "", key: "", description: "", icon: "" })

  const { isOpen, config, showDelete, showSuccess, showError, closeModal } = useConfirmModal()

  const [product, setProduct] = useState(null)
  const [attributes, setAttributes] = useState(/** @type {any[]} */ ([]))
  const [selectedAttributeValue, setSelectedAttributeValue] = useState(null)
  const [selectedAttributeValues, setSelectedAttributeValues] = useState({})
  const [editingAttributeValues, setEditingAttributeValues] = useState({})

  // New category form state
  const [newCategoryForm, setNewCategoryForm] = useState({
    name: "",
    key: "",
    description: "",
    icon: "",
    attributes: /** @type {any[]} */ ([{ name: "subcategories", displayName: "Subcategories", items: [] }])
  })

  // Initialize state from props
  useEffect(() => {
    if (category && category !== selectedMainCategory) {
      setSelectedMainCategory(category)
    }
  }, [category])

  useEffect(() => {
    console.log(" CategoryFilters received selectedFilters:", selectedFilters);
    if (selectedFilters && Object.keys(selectedFilters).length > 0) {
      console.log(" Setting currentSelectedFilters to:", selectedFilters);
      setCurrentSelectedFilters(selectedFilters)
      
      // Also initialize selectedAttributeValues for editing products
      const attributeValues = {};
      Object.entries(selectedFilters).forEach(([key, values]) => {
        if (Array.isArray(values) && values.length > 0) {
          attributeValues[key] = values;
        } else if (typeof values === 'string') {
          attributeValues[key] = [values];
        }
      });
      console.log(" Initializing selectedAttributeValues for editing:", attributeValues);
      setSelectedAttributeValues(attributeValues);
    }
  }, [selectedFilters])

  // Watch for changes in selectedAttributeValues and notify parent
  useEffect(() => {
    if (isProductForm && onFiltersChange) {
      // Convert selectedAttributeValues to the expected filters format
      const filters = {};
      Object.entries(selectedAttributeValues).forEach(([key, values]) => {
        if (Array.isArray(values) && values.length > 0) {
          filters[key] = values;
        }
      });
      
      // Only call onFiltersChange if the filters have actually changed
      const currentFiltersString = JSON.stringify(filters);
      const previousFiltersString = JSON.stringify(currentSelectedFilters);
      
      if (currentFiltersString !== previousFiltersString) {
        console.log(" Selected Attribute Values Changed:", selectedAttributeValues);
        console.log(" Converted Filters:", filters);
        onFiltersChange(filters);
      }
    }
  }, [selectedAttributeValues, isProductForm, onFiltersChange, currentSelectedFilters]);

  // Load categories and products from backend on component mount
  useEffect(() => {
    loadCategories()
    if (!isProductForm) {
      loadProducts()
    }
  }, [isProductForm])

  // Initialize selectedAttributeValues when category system loads and we have selectedFilters
  useEffect(() => {
    if (Object.keys(categorySystem).length > 0 && selectedFilters && Object.keys(selectedFilters).length > 0 && isProductForm) {
      console.log(" Category system loaded, initializing selectedAttributeValues from selectedFilters:", selectedFilters);
      const attributeValues = {};
      Object.entries(selectedFilters).forEach(([key, values]) => {
        if (Array.isArray(values) && values.length > 0) {
          attributeValues[key] = values;
        } else if (typeof values === 'string') {
          attributeValues[key] = [values];
        }
      });
      console.log(" Setting selectedAttributeValues:", attributeValues);
      setSelectedAttributeValues(attributeValues);
    }
  }, [categorySystem, selectedFilters, isProductForm])

  // Filter products when category or filters change
  useEffect(() => {
    if (!isProductForm) {
      filterProducts()
    }
  }, [selectedMainCategory, currentSelectedFilters, products, isProductForm])

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`);
        const result = await res.json();
        const data = result.data;
        if (Array.isArray(data)) {
          const categoriesByKey = {};
          data.forEach(cat => {
            categoriesByKey[cat.key] = cat;
          });
          setCategorySystem(categoriesByKey);
        } else {
          console.error("Categories API did not return an array:", data);
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    }
    fetchCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`)
      const data = await response.json()
      setCategorySystem(data)
    } catch (error) {
      console.error("Error loading categories:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`)
      const data = await response.json()
      setProducts(data)
    } catch (error) {
      console.error("Error loading products:", error)
    }
  }

  const filterProducts = () => {
    if (!selectedMainCategory) {
      setFilteredProducts([])
      return
    }

    const filtered = products.filter((product) => {
      // Match main category
      if (product.mainCategory !== selectedMainCategory) {
        return false
      }

      // Match selected filters
      for (const [filterType, selectedItems] of Object.entries(currentSelectedFilters)) {
        if (selectedItems && selectedItems.length > 0) {
          const productFilterValues = product.filters?.[filterType] || []
          const hasMatch = selectedItems.some((item) => productFilterValues.includes(item))
          if (!hasMatch) {
            return false
          }
        }
      }

      return true
    })

    setFilteredProducts(filtered)
  }

  // const loadDefaultCategories = () => {
  //   // s
  //   setCategorySystem(defaultCategories)
  // }

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://best-wishes-final-production-e20b.up.railway.app/api';

  // Save categories to backend
  const saveCategories = async (updatedCategories) => {
    try {
      await fetch(`${API_BASE_URL}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedCategories),
      })
    } catch (error) {
      console.error("Error saving categories:", error)
    }
  }

  // Create new main category
  const createNewCategory = async () => {
    if (!newCategoryForm.name || !newCategoryForm.key) {
      showError("Validation Error", "Please fill in category name and key")
      return
    }

    if (categorySystem[newCategoryForm.key]) {
      showError("Validation Error", "Category key already exists")
      return
    }

    // Validate that at least one attribute has items
    const hasValidAttributes = newCategoryForm.attributes.some((attr) => attr.items.length > 0)
    if (!hasValidAttributes) {
      showError("Validation Error", "Please add at least one item to your category attributes")
      return
    }

    console.log("Sending category:", newCategoryForm);

    await fetch(`${API_BASE_URL}/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCategoryForm)
    });

    // Auto-select the newly created category
    setSelectedMainCategory(newCategoryForm.key)
    setCurrentSelectedFilters({})
    onCategoryChange(newCategoryForm.key)
    if (onFiltersChange) {
      onFiltersChange({})
    }

    // Reset form
    setNewCategoryForm({
      name: "",
      key: "",
      description: "",
      icon: "",
      attributes: /** @type {any[]} */ ([{ name: "subcategories", displayName: "Subcategories", items: [] }])
    })
    setShowCreateCategoryForm(false)


            showSuccess("Success", `Category "${newCategoryForm.name}" created successfully and selected!`)

    alert(`Category "${newCategoryForm.name}" created successfully and selected!`)

  }

  // Add attribute to new category form
  const addAttributeToForm = () => {
    const attributeName = prompt("Enter attribute name (e.g., colors, sizes, materials):")
    if (!attributeName) return

    const displayName = prompt("Enter display name (e.g., Colors, Sizes, Materials):")
    if (!displayName) return

    // Check for duplicates
    const exists = newCategoryForm.attributes.some((attr) => attr.name.toLowerCase() === attributeName.toLowerCase())

    if (exists) {
      showError("Validation Error", "An attribute with this name already exists!")
      return
    }

    setNewCategoryForm((prev) => ({
      ...prev,
      attributes: [
        ...prev.attributes,
        {
          name: attributeName.toLowerCase().replace(/\s+/g, ""),
          displayName,
          items: [],
        },
      ],
    }))
  }

  // Add item to attribute in form
  const addItemToAttribute = (attributeIndex, item) => {
    if (!item || !item.trim()) return

    // Split by comma and process each item
    const items = item.split(',').map(i => i.trim()).filter(i => i.length > 0)
    const currentAttribute = newCategoryForm.attributes[attributeIndex]
    const newItems = []
    const duplicates = []

    // Check each item for duplicates
    items.forEach(trimmedItem => {
      if (currentAttribute.items.includes(trimmedItem)) {
        duplicates.push(trimmedItem)
      } else {
        newItems.push(trimmedItem)
      }
    })

    // Show warning for duplicates if any
    if (duplicates.length > 0) {
      showError("Duplicate Items", `The following items already exist: ${duplicates.join(', ')}`)
    }

    // Add only new items
    if (newItems.length > 0) {
      setNewCategoryForm((prev) => ({
        ...prev,
        attributes: prev.attributes.map((attr, index) =>
          index === attributeIndex ? { ...attr, items: [...attr.items, ...newItems] } : attr,
        ),
      }))
      
      // Show success message for added items
      if (newItems.length === 1) {
        console.log(`Added item: ${newItems[0]}`)
      } else {
        console.log(`Added ${newItems.length} items: ${newItems.join(', ')}`)
      }
    }
  }

  // Remove item from attribute in form
  const removeItemFromAttribute = (attributeIndex, itemIndex) => {
    setNewCategoryForm((prev) => ({
      ...prev,
      attributes: prev.attributes.map((attr, index) =>
        index === attributeIndex ? { ...attr, items: attr.items.filter((_, i) => i !== itemIndex) } : attr,
      ),
    }))
  }

  // Remove attribute from form
  const removeAttributeFromForm = (attributeIndex) => {
    setNewCategoryForm((prev) => ({
      ...prev,
      attributes: prev.attributes.filter((_, index) => index !== attributeIndex),
    }))
  }

  // Generate category key from name
  const generateCategoryKey = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
  }

  // Update category key when name changes
  useEffect(() => {
    if (newCategoryForm.name) {
      setNewCategoryForm((prev) => ({
        ...prev,
        key: generateCategoryKey(prev.name),
      }))
    }
  }, [newCategoryForm.name])

  // Handle main category selection
  const handleMainCategorySelect = (categoryKey) => {
    setSelectedMainCategory(categoryKey)
    const emptyFilters = {}
    setCurrentSelectedFilters(emptyFilters)
    setSelectedAttributeValues({})

    // Notify parent components
    onCategoryChange(categoryKey)
    if (onFiltersChange) {
      onFiltersChange(emptyFilters)
    }
    
    // If we're editing a product and have selectedFilters, try to match them to the new category
    if (isProductForm && selectedFilters && Object.keys(selectedFilters).length > 0) {
      console.log(" Category changed, checking if selectedFilters match new category:", categoryKey);
      // The selectedFilters will be re-processed by the useEffect above
    }
  }

  // Handle filter selection
  const handleFilterSelection = (filterType, item) => {
    const currentItems = currentSelectedFilters[filterType] || []
    let newItems

    if (currentItems.includes(item)) {
      newItems = currentItems.filter((i) => i !== item)
    } else {
      newItems = [...currentItems, item]
    }

    const updatedFilters = {
      ...currentSelectedFilters,
      [filterType]: newItems,
    }

    setCurrentSelectedFilters(updatedFilters)

    // Notify parent if in product form
    if (onFiltersChange) {
      onFiltersChange(updatedFilters)
    }
  }

  // Delete main category
  const deleteMainCategory = async (categoryKey) => {
    if (confirm(`Delete the entire "${categorySystem[categoryKey].name}" category? This cannot be undone.`)) {
      try {
        // Delete from database
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/${categoryKey}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });

          if (response.ok) {
            // Update local state immediately
            const updatedCategories = { ...categorySystem };
            const deletedCategoryName = categorySystem[categoryKey].name;
            delete updatedCategories[categoryKey];
            setCategorySystem(updatedCategories);

            // Clear selected category if it was the deleted one
            if (selectedMainCategory === categoryKey) {
              setSelectedMainCategory("");
              setCurrentSelectedFilters({});
              onCategoryChange("");
              if (onFiltersChange) {
                onFiltersChange({});
              }
            }

            // Clear any editing states
            setEditingMainCategory(null);
            setMainCategoryEditForm({ name: "", key: "", description: "", icon: "" });

          alert(`Category "${deletedCategoryName}" deleted successfully!`);
        } else {
          const errorData = await response.json();
          alert(`Failed to delete category: ${errorData.message || 'Unknown error'}`);
        }
      } catch (error) {
        console.error("Error deleting category:", error);
        alert("Error deleting category. Please try again.");
      }
    }
  }

  // CRUD Operations for existing categories
  const addItem = async (categoryKey, filterType, newItem) => {
    if (newItem && !categorySystem[categoryKey][filterType].includes(newItem)) {
      const updatedCategories = {
        ...categorySystem,
        [categoryKey]: {
          ...categorySystem[categoryKey],
          [filterType]: [...categorySystem[categoryKey][filterType], newItem],
        },
      }

      setCategorySystem(updatedCategories)
      await saveCategories(updatedCategories)

      setNewItemInputs((prev) => ({ ...prev, [`${categoryKey}-${filterType}`]: "" }))
      setShowAddInput((prev) => ({ ...prev, [`${categoryKey}-${filterType}`]: false }))
    }
  }

  const editItem = async (categoryKey, filterType, oldItem, newItem) => {
    if (newItem && newItem !== oldItem && !categorySystem[categoryKey][filterType].includes(newItem)) {
      const updatedCategories = {
        ...categorySystem,
        [categoryKey]: {
          ...categorySystem[categoryKey],
          [filterType]: categorySystem[categoryKey][filterType].map((item) => (item === oldItem ? newItem : item)),
        },
      }

      setCategorySystem(updatedCategories)
      await saveCategories(updatedCategories)

      setEditingItems((prev) => ({ ...prev, [`${categoryKey}-${filterType}-${oldItem}`]: false }))
    }
  }

  const deleteItem = async (categoryKey, filterType, itemToDelete) => {
    showDelete(
      "Delete Item",
      `Delete "${itemToDelete}"?`,
      async () => {
      const updatedCategories = {
        ...categorySystem,
        [categoryKey]: {
          ...categorySystem[categoryKey],
          [filterType]: categorySystem[categoryKey][filterType].filter((item) => item !== itemToDelete),
        },
      }

      setCategorySystem(updatedCategories)
      await saveCategories(updatedCategories)

      // Update current selected filters
      setCurrentSelectedFilters((prev) => ({
        ...prev,
        [filterType]: prev[filterType]?.filter((item) => item !== itemToDelete) || [],
      }))
    })
  }

  const startEditing = (categoryKey, filterType, item) => {
    setEditingItems((prev) => ({ ...prev, [`${categoryKey}-${filterType}-${item}`]: item }))
  }

  const cancelEditing = (categoryKey, filterType, item) => {
    setEditingItems((prev) => ({ ...prev, [`${categoryKey}-${filterType}-${item}`]: false }))
  }

  const clearAllFilters = () => {
    setCurrentSelectedFilters({})
    setSelectedAttributeValues({})
    if (onFiltersChange) {
      onFiltersChange({})
    }
  }

  const deleteProduct = async (productId) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await fetch(`/api/products/${productId}`, { method: "DELETE" })
        loadProducts() // Reload products
      } catch (error) {
        console.error("Error deleting product:", error)
      }
    }
  }

  // Add new attribute value to database and update state
  const addAttributeValue = async (attributeName, newValue) => {
    if (!newValue || !newValue.trim()) return;

    const trimmedValue = newValue.trim();

    try {
      const existingAttribute = attributes.find((attr) => attr.name === attributeName);
      if (existingAttribute && existingAttribute.items.includes(trimmedValue)) {
        showError("Validation Error", `\"${trimmedValue}\" already exists in this attribute!`);
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/categories/${selectedMainCategory}/attributes/${attributeName}/items`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ value: trimmedValue }),
        }
      );

      if (response.ok) {
        const updatedAttributes = attributes.map((attribute) => {
          if (attribute.name === attributeName) {
            return {
              ...attribute,
              items: [...attribute.items, trimmedValue],
            };
          }
          return attribute;
        });
        setAttributes(updatedAttributes);
        showSuccess("Success", `\"${trimmedValue}\" added successfully to ${attributeName}!`);
      } else {
        const errorData = await response.json();
        showError("Error", `Failed to add value: ${errorData.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error adding attribute value:", error);
      showError("Error", "Error adding attribute value. Please try again.");
    }
  }

  // Add new attribute value to category system (for second section)
  const addAttributeValueToCategory = async (attributeName, newValue) => {
    if (!newValue || !newValue.trim()) return;
    
    const trimmedValue = newValue.trim();
    
    try {
      // Check if value already exists in category system
      const category = categorySystem[selectedMainCategory];
      if (category && category.attributes) {
        const attribute = category.attributes.find(attr => attr.name === attributeName);
        if (attribute && attribute.items.includes(trimmedValue)) {
          showError("Validation Error", `"${trimmedValue}" already exists in this attribute!`);
          return;
        }
      }

      // Add to database
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/${selectedMainCategory}/attributes/${attributeName}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value: trimmedValue })
      });

      if (response.ok) {
        // Update category system state
        const updatedCategorySystem = { ...categorySystem };
        const category = updatedCategorySystem[selectedMainCategory];
        if (category && category.attributes) {
          const updatedAttributes = category.attributes.map(attribute => {
            if (attribute.name === attributeName) {
              return {
                ...attribute,
                items: [...attribute.items, trimmedValue]
              };
            }
            return attribute;
          });
          updatedCategorySystem[selectedMainCategory] = {
            ...category,
            attributes: updatedAttributes
          };
          setCategorySystem(updatedCategorySystem);
        }
        
        // Show success message
        showSuccess("Success", `"${trimmedValue}" added successfully to ${attributeName}!`, () => {
          // Stay on the same page - no navigation
        });
      } else {
        const errorData = await response.json();
        showError("Error", `Failed to add value: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding attribute value:', error);
      showError("Error", "Error adding attribute value. Please try again.");
    }
  }

  // Start editing attribute value
  const startEditingAttributeValue = (attributeName, oldValue) => {
    setEditingAttributeValues(prev => ({
      ...prev,
      [`${attributeName}-${oldValue}`]: oldValue
    }));
  };

  // Cancel editing attribute value
  const cancelEditingAttributeValue = (attributeName, oldValue) => {
    setEditingAttributeValues(prev => {
      const newState = { ...prev };
      delete newState[`${attributeName}-${oldValue}`];
      return newState;
    });
  };

  // Save edited attribute value
  const saveEditedAttributeValue = async (attributeName, oldValue, newValue) => {
    console.log('Saving edited value:', { attributeName, oldValue, newValue }); // Debug log
    
    if (!newValue || !newValue.trim()) {
      showError("Validation Error", "Value cannot be empty!");
      return;
    }

    const trimmedValue = newValue.trim();
    
    if (trimmedValue === oldValue) {
      cancelEditingAttributeValue(attributeName, oldValue);
      return;
    }

    try {
      // Check if new value already exists
      const category = categorySystem[selectedMainCategory];
      if (category && category.attributes) {
        const attribute = category.attributes.find(attr => attr.name === attributeName);
        if (attribute && attribute.items.includes(trimmedValue) && trimmedValue !== oldValue) {
          showError("Validation Error", `"${trimmedValue}" already exists in this attribute!`);
          return;
        }
      }

      console.log('Making PUT request to:', `${process.env.NEXT_PUBLIC_API_URL}/categories/${selectedMainCategory}/attributes/${attributeName}/items/${encodeURIComponent(oldValue)}`);
      console.log('Request body:', { newValue: trimmedValue });

      // Update in database
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/${selectedMainCategory}/attributes/${attributeName}/items/${encodeURIComponent(oldValue)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newValue: trimmedValue })
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const responseData = await response.json();
        console.log('Response data:', responseData);

        // Update category system state
        const updatedCategorySystem = { ...categorySystem };
        const category = updatedCategorySystem[selectedMainCategory];
        if (category && category.attributes) {
          const updatedAttributes = category.attributes.map(attribute => {
            if (attribute.name === attributeName) {
              return {
                ...attribute,
                items: attribute.items.map(item => item === oldValue ? trimmedValue : item)
              };
            }
            return attribute;
          });
          updatedCategorySystem[selectedMainCategory] = {
            ...category,
            attributes: updatedAttributes
          };
          setCategorySystem(updatedCategorySystem);
        }

        // Update attributes state for first section
        const updatedAttributes = attributes.map(attribute => {
          if (attribute.name === attributeName) {
            return {
              ...attribute,
              items: attribute.items.map(item => item === oldValue ? trimmedValue : item)
            };
          }
          return attribute;
        });
        setAttributes(updatedAttributes);

        // Update selected values if the edited value was selected
        if (Array.isArray(selectedAttributeValues[attributeName]) && selectedAttributeValues[attributeName].includes(oldValue)) {
          setSelectedAttributeValues(prev => ({
            ...prev,
            [attributeName]: prev[attributeName].map(v => v === oldValue ? newValue : v)
          }));
        }

        // Exit edit mode
        cancelEditingAttributeValue(attributeName, oldValue);
        
        showSuccess("Success", `"${oldValue}" updated to "${trimmedValue}" successfully!`, () => {
          // Stay on the same page - no navigation
        });
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        showError("Error", `Failed to update value: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating attribute value:', error);
      showError("Error", "Error updating attribute value. Please try again.");
    }
  };

  // Edit main category
  const startEditMainCategory = (categoryKey) => {
    setEditingMainCategory(categoryKey)
    setMainCategoryEditForm({
      name: categorySystem[categoryKey].name,
      key: categoryKey,
      description: categorySystem[categoryKey].description || "",
      icon: categorySystem[categoryKey].icon || ""
    })
  }
  const cancelEditMainCategory = () => {
    setEditingMainCategory(null)
    setMainCategoryEditForm({ name: "", key: "", description: "", icon: "" })
  }
  const saveEditMainCategory = async (oldKey) => {
    try {
      // Validate form data
      if (!mainCategoryEditForm.name || !mainCategoryEditForm.key) {
        showError("Validation Error", "Please fill in category name and key");
        return;
      }

      // Check if new key already exists (if key changed)
      if (mainCategoryEditForm.key !== oldKey && categorySystem[mainCategoryEditForm.key]) {
        showError("Validation Error", "Category key already exists");
        return;
      }

      // Prepare the updated category data
      const updatedCategoryData = {
        name: mainCategoryEditForm.name,
        key: mainCategoryEditForm.key,
        description: mainCategoryEditForm.description,
        icon: mainCategoryEditForm.icon,
        attributes: categorySystem[oldKey].attributes || []
      };

      // Update in database
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/${oldKey}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedCategoryData)
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update local state immediately
        const updatedCategories = { ...categorySystem };
        
        // If key changed, move the category to new key
        if (mainCategoryEditForm.key !== oldKey) {
          updatedCategories[mainCategoryEditForm.key] = result.data;
          delete updatedCategories[oldKey];
          
          // Update selected category if it was the edited one
          if (selectedMainCategory === oldKey) {
            setSelectedMainCategory(mainCategoryEditForm.key);
            onCategoryChange(mainCategoryEditForm.key);
          }
        } else {
          updatedCategories[oldKey] = result.data;
        }
        
        setCategorySystem(updatedCategories);
        
        // Clear editing state
        setEditingMainCategory(null);
        setMainCategoryEditForm({ name: "", key: "", description: "", icon: "" });
        
        showSuccess("Success", `Category "${mainCategoryEditForm.name}" updated successfully!`, () => {
          // Stay on the same page - no navigation
          console.log("Category updated successfully, staying on current page");
        });
      } else {
        const errorData = await response.json();
        showError("Error", `Failed to update category: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error updating category:", error);
      showError("Error", "Error updating category. Please try again.");
    }
  }

  // Get available main categories
  const mainCategories = Object.keys(categorySystem)
  const currentCategoryData = selectedMainCategory ? categorySystem[selectedMainCategory] : null

  const FilterSection = ({ title, filterType, items = [], categoryKey }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="font-medium text-lg">{title}</h3>
            <Badge variant="outline" className="text-xs">
              {items.length} items
            </Badge>
            {currentSelectedFilters[filterType]?.length > 0 && (
              <Badge variant="default" className="text-xs">
                {currentSelectedFilters[filterType].length} selected
              </Badge>
            )}
          </div>
          {!isProductForm && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowAddInput((prev) => ({ ...prev, [`${categoryKey}-${filterType}`]: true }))}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Add new item input - only show if not in product form */}
        {!isProductForm && showAddInput[`${categoryKey}-${filterType}`] && (
          <div className="flex gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
            <Input
              placeholder={`Add new ${title.toLowerCase()}`}
              value={newItemInputs[`${categoryKey}-${filterType}`] || ""}
              onChange={(e) =>
                setNewItemInputs((prev) => ({
                  ...prev,
                  [`${categoryKey}-${filterType}`]: e.currentTarget.value,
                }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.currentTarget.value && e.currentTarget.value.trim()) {
                  addItem(categoryKey, filterType, e.currentTarget.value.trim())
                }
                if (e.key === "Escape") {
                  setShowAddInput((prev) => ({ ...prev, [`${categoryKey}-${filterType}`]: false }))
                }
              }}
              className="text-sm"
              autoFocus
            />
            <Button
              type="button"
              size="sm"
              onClick={() => {
                  const value = newItemInputs[`${categoryKey}-${filterType}`];
                  if(value && value.trim()) {
                    addItem(categoryKey, filterType, value.trim());
                  }
              }}
            >
              <Save className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setShowAddInput((prev) => ({ ...prev, [`${categoryKey}-${filterType}`]: false }))}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Items as inline tags */}
        <div className="flex flex-wrap gap-2">
          {Array.isArray(items) && items.map((item, index) => (
            <div key={index} className="flex items-center">
              {editingItems[`${categoryKey}-${filterType}-${item}`] ? (
                <div className="flex items-center gap-1 bg-white border rounded-md px-2 py-1">
                  <Input
                    value={editingItems[`${categoryKey}-${filterType}-${item}`]}
                    onChange={(e) =>
                      setEditingItems((prev) => ({
                        ...prev,
                        [`${categoryKey}-${filterType}-${item}`]: e.currentTarget.value,
                      }))
                    }
                    className="h-6 text-sm border-0 p-0 w-24"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.currentTarget.value && e.currentTarget.value.trim()) {
                        editItem(categoryKey, filterType, item, e.currentTarget.value.trim())
                      }
                      if (e.key === "Escape") {
                        cancelEditing(categoryKey, filterType, item)
                      }
                    }}
                    autoFocus
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-5 w-5 p-0"
                    onClick={() => {
                      const newValue = editingItems[`${categoryKey}-${filterType}-${item}`];
                      if(newValue && newValue.trim()){
                        editItem(categoryKey, filterType, item, newValue.trim());
                      }
                    }}
                  >
                    <Save className="w-3 h-3" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-5 w-5 p-0"
                    onClick={() => cancelEditing(categoryKey, filterType, item)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <Badge
                  variant={currentSelectedFilters[filterType]?.includes(item) ? "default" : "secondary"}
                  className="flex items-center gap-1 px-3 py-1 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleFilterSelection(filterType, item)}
                >
                  {item}
                  {!isProductForm && (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-4 w-4 p-0 ml-1 hover:text-blue-500"
                        onClick={e => {
                          e.stopPropagation();
                          startEditing(categoryKey, filterType, item);
                        }}
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-4 w-4 p-0 hover:text-red-500"
                        onClick={e => {
                          e.stopPropagation();
                          deleteItem(categoryKey, filterType, item);
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                </Badge>
              )}
            </div>
          ))}

        </div>

        {/* Empty state */}
        {items.length === 0 && !isProductForm && (
          <div className="text-center py-4 text-gray-500">
            <p className="text-sm">No {title.toLowerCase()} added yet</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => setShowAddInput((prev) => ({ ...prev, [`${categoryKey}-${filterType}`]: true }))}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First {title.slice(0, -1)}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )

  const ProductCard = ({ product }) => (
    <Card className="overflow-hidden">
      <div className="aspect-square relative">
        <img
          src={product.images?.[0] || "/placeholder.svg?height=200&width=200"}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        <Badge variant="secondary" className="absolute top-2 right-2">
          {product.status}
        </Badge>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2 truncate">{product.name}</h3>
        <p className="text-sm text-gray-600 mb-2">SKU: {product.sku}</p>
        <div className="flex justify-between items-center mb-3">
          <span className="text-lg font-bold">${product.price}</span>
          <Badge variant="outline">{product.mainCategory}</Badge>
        </div>

        {/* Product Filters */}
        {product.filters && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">Filters:</p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(product.filters).map(([filterType, values]) =>
                values.map((value) => (
                  <Badge key={`${filterType}-${value}`} variant="outline" className="text-xs">
                    {value}
                  </Badge>
                )),
              )}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Stock: {product.stock}</span>
          <div className="flex gap-2">
            <Link href={`/products/${product.id}`}>
              <Button size="sm" variant="outline">
                <Eye className="w-4 h-4" />
              </Button>
            </Link>
            <Link href={`/products/edit/${product.id}`}>
              <Button size="sm" variant="outline">
                <Edit2 className="w-4 h-4" />
              </Button>
            </Link>
            <Button size="sm" variant="outline" onClick={() => deleteProduct(product.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  useEffect(() => {
    if (productId) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${productId}`)
        .then(res => res.json())
        .then(data => {
          if (data) {
            setProduct(data);
          } else {
            console.error("Product data is null or undefined.");
          }
        })
        .catch(err => console.error("Error fetching product data:", err));
    }
  }, [productId]);

  useEffect(() => {
    if (!selectedMainCategory) return;
    async function fetchAttributes() {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/${selectedMainCategory}`);
      const result = await res.json();
      const category = result.data || result;
      setAttributes(category.attributes || []);
    }
    fetchAttributes();
  }, [selectedMainCategory]);

  const handleAttributeValueSelect = (attributeName, value) => {
    setSelectedAttributeValues((prev) => {
      const prevValues = Array.isArray(prev[attributeName]) ? prev[attributeName] : [];
      let newValues;
      if (prevValues.includes(value)) {
        newValues = prevValues.filter((v) => v !== value);
      } else {
        newValues = [...prevValues, value];
      }
      return { ...prev, [attributeName]: newValues };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {!isProductForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Folder className="w-5 h-5" />
              Dynamic Category Management System
            </CardTitle>
            <p className="text-sm text-gray-600">
              Create new main categories with custom attributes, manage filters, and view matching products.
            </p>
          </CardHeader>
        </Card>
      )}

      {/* Create New Category Form - Show for both product form and regular view */}
      {showCreateCategoryForm && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Create New Main Category
              </span>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowCreateCategoryForm(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Keep all the existing form content exactly the same */}
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="categoryName">Category Name *</Label>
                <Input
                  id="categoryName"
                  value={newCategoryForm.name}
                  onChange={(e) => setNewCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Jewelry, Electronics, Sports"
                />
              </div>
              <div>
                <Label htmlFor="categoryKey">Category Key *</Label>
                <Input
                  id="categoryKey"
                  value={newCategoryForm.key}
                  onChange={(e) => setNewCategoryForm((prev) => ({ ...prev, key: e.target.value }))}
                  placeholder="e.g., jewelry, electronics, sports"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="categoryIcon">Icon</Label>
              <MediaUpload
                onImagesChange={(images) => {
                  setNewCategoryForm((prev) => ({ ...prev, icon: images?.[0]?.url || "" }));
                }}
                images={newCategoryForm.icon ? [{ id: 'icon', url: newCategoryForm.icon, name: 'Category Icon' }] : []}
                onVideosChange={() => {}} 
                videos={[]}
              />
            </div>

            <div>
              <Label htmlFor="categoryDescription">Description</Label>
              <Textarea
                id="categoryDescription"
                value={newCategoryForm.description}
                onChange={(e) => setNewCategoryForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this category"
                rows={3}
              />
            </div>

            {/* Attributes section - keep all existing code */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <Label className="text-lg font-medium">Category Attributes</Label>
                <Button type="button" variant="outline" size="sm" onClick={addAttributeToForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Attribute
                </Button>
              </div>

              {newCategoryForm.attributes.length === 0 && (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                  <p>No attributes added yet. Click "Add Attribute" to create your first filter category.</p>
                </div>
              )}

              <div className="space-y-4">
                {newCategoryForm.attributes.map((attribute, attributeIndex) => (
                  <Card key={attributeIndex} className="p-4 border-l-4 border-l-blue-500">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-lg">{attribute.displayName}</h4>
                        <p className="text-sm text-gray-500">Key: {attribute.name}</p>
                        <p className="text-xs text-gray-400">{attribute.items.length} items</p>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeAttributeFromForm(attributeIndex)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Add items to attribute */}
                    <div className="flex gap-2 mb-3">
                      <Input
                        placeholder={`Add ${attribute.displayName.toLowerCase()} item (e.g., Red, Large, Cotton)`}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && e.currentTarget.value.trim()) {
                            addItemToAttribute(attributeIndex, e.currentTarget.value.trim())
                            e.currentTarget.value = ""
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={(e) => {
                          const input = e.currentTarget.parentElement?.querySelector("input")
                          if (input && input.value.trim()) {
                            addItemToAttribute(attributeIndex, input.value.trim())
                            input.value = ""
                          }
                        }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Display items */}
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(attribute.items) && attribute.items.map((item) => (
                        <Badge key={item}>{item}</Badge>
                      ))}
                    </div>

                    {attribute.items.length === 0 && (
                      <div className="text-center py-4 text-gray-400 border border-dashed border-gray-200 rounded">
                        <p className="text-sm">No items added to {attribute.displayName} yet</p>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => setShowCreateCategoryForm(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={createNewCategory}
                disabled={
                  !newCategoryForm.name ||
                  !newCategoryForm.key ||
                  newCategoryForm.attributes.every((attr) => attr.items.length === 0)
                }
              >
                Create Category
                {newCategoryForm.attributes.some((attr) => attr.items.length > 0) && (
                  <Badge variant="secondary" className="ml-2">
                    {newCategoryForm.attributes.reduce((total, attr) => total + attr.items.length, 0)} items
                  </Badge>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Category Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between flex-col sm:flex-row gap-4">
            <span>{isProductForm ? "Select Main Category" : `Main Category Selection (${mainCategories.length})`}</span>
            {/* ADD THIS: Show Create New Category button for both product form and regular view */}
            <Button type="button" variant="outline" onClick={() => setShowCreateCategoryForm(true)} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Create New Category
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mainCategories.map((categoryKey) => (
              <div
                key={categoryKey}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all relative ${
                  selectedMainCategory === categoryKey
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => handleMainCategorySelect(categoryKey)}
              >
                <div className="absolute top-2 right-2 flex gap-1 z-10">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={e => { e.stopPropagation(); startEditMainCategory(categoryKey); }}
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={e => { e.stopPropagation(); deleteMainCategory(categoryKey); }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                {editingMainCategory === categoryKey ? (
                  <div className="space-y-2">
                    <Input value={mainCategoryEditForm.name} onChange={e => setMainCategoryEditForm(f => ({ ...f, name: e.target.value }))} placeholder="Category Name" className="mb-1" />
                    <Input value={mainCategoryEditForm.key} onChange={e => setMainCategoryEditForm(f => ({ ...f, key: e.target.value }))} placeholder="Category Key" className="mb-1" />
                    <Input value={mainCategoryEditForm.description} onChange={e => setMainCategoryEditForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" className="mb-1" />
                    <div className="mt-2">
                        <Label className="text-sm font-medium">Icon</Label>
                        <MediaUpload
                            onImagesChange={(images) => {
                                setMainCategoryEditForm((prev) => ({ ...prev, icon: images?.[0]?.url || "" }));
                            }}
                            images={mainCategoryEditForm.icon ? [{ id: 'icon', url: mainCategoryEditForm.icon, name: 'Category Icon' }] : []}
                            onVideosChange={() => {}}
                        />
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" size="sm" onClick={e => { e.stopPropagation(); saveEditMainCategory(categoryKey) }}>Save</Button>
                      <Button type="button" size="sm" variant="outline" onClick={e => { e.stopPropagation(); cancelEditMainCategory() }}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className={`text-center ${!isProductForm ? "pr-8" : ""} flex flex-col items-center relative`}>
                    {categorySystem[categoryKey].icon && (
                      <img
                        src={categorySystem[categoryKey].icon}
                        alt={`${categorySystem[categoryKey].name} icon`}
                        className="w-12 h-12 mb-2 object-contain"
                      />
                    )}
                    <div className="flex items-center gap-2 justify-center w-full mb-1">
                      <h3 className="font-medium text-lg">{categorySystem[categoryKey].name}</h3>
                      {!isProductForm && (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={e => { e.stopPropagation(); startEditMainCategory(categoryKey); }}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={e => { e.stopPropagation(); deleteMainCategory(categoryKey); }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{categorySystem[categoryKey].description || "No description"}</p>
                    <p className="text-xs text-gray-400 mt-1">{Array.isArray(categorySystem[categoryKey].attributes) ? categorySystem[categoryKey].attributes.length : 0} attributes</p>
                    {selectedMainCategory === categoryKey && (
                      <Badge variant="default" className="mt-2">Selected</Badge>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Filters Based on Selected Category */}
      {currentCategoryData && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{isProductForm ? "Select Product Filters" : `Filters for ${currentCategoryData?.name || selectedMainCategory || "No category"}`}</span>
                <div className="flex gap-2">
                  <Badge variant="outline">
                    {Object.values(currentSelectedFilters).flat().length + Object.keys(selectedAttributeValues).length} total selections
                  </Badge>
                  {(Object.values(currentSelectedFilters).flat().length > 0 || Object.keys(selectedAttributeValues).length > 0) && (
                    <Button type="button" variant="outline" size="sm" onClick={clearAllFilters}>
                      Clear All
                    </Button>
                  )}
                  {!isProductForm && (
                    <Button type="button" variant="default" size="sm" onClick={() => setShowProducts(!showProducts)}>
                      <Search className="w-4 h-4 mr-2" />
                      {showProducts ? "Hide Products" : "Show Products"} ({filteredProducts.length})
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Render all attributes dynamically */}
          {attributes.map(attr => (
            <div key={attr.name} style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>{attr.displayName}</h3>
              
              {/* Add new value input and button */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <Input
                  placeholder={`Add new ${attr.displayName.toLowerCase()}...`}
                  style={{ 
                    width: "200px", 
                    height: "36px", 
                    fontSize: "0.875rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    padding: "0.5rem 0.75rem"
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.currentTarget.value.trim()) {
                      addAttributeValue(attr.name, e.currentTarget.value.trim());
                      e.currentTarget.value = "";
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={(e) => {
                    const input = e.currentTarget.parentElement.querySelector("input");
                    if (input && input.value.trim()) {
                      addAttributeValue(attr.name, input.value.trim());
                      input.value = "";
                    }
                  }}
                  style={{
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    border: "none",
                    borderRadius: "6px",
                    padding: "0.5rem 1rem",
                    color: "white",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    transition: "all 0.2s ease",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
                  }}
                >
                  <Plus size={16} />
                  Add
                </Button>
              </div>
              
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {attr.items.map((item) => {
                  const isEditing = editingAttributeValues[`${attr.name}-${item}`];
                  const isSelected = Array.isArray(selectedAttributeValues[attr.name]) && selectedAttributeValues[attr.name].includes(item);
                  return (
                    <span
                      key={item}
                      onClick={() => !isEditing && handleAttributeValueSelect(attr.name, item)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        background: isSelected ? "#a78bfa" : "#f3f3f3",
                        color: isSelected ? "#fff" : "#000",
                        borderRadius: "8px",
                        padding: "0.25rem 0.75rem",
                        fontSize: "0.95rem",
                        cursor: isEditing ? "default" : "pointer",
                        border: isSelected ? "2px solid #7c3aed" : "none",
                        transition: "all 0.2s",
                        marginRight: "0.5rem"
                      }}
                    >
                      {isEditing ? (
                        <>
                          <input
                            type="text"
                            defaultValue={item}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "inherit",
                              fontSize: "inherit",
                              outline: "none",
                              width: "80px",
                              marginRight: "0.5rem"
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                saveEditedAttributeValue(attr.name, item, e.currentTarget.value);
                              } else if (e.key === "Escape") {
                                cancelEditingAttributeValue(attr.name, item);
                              }
                            }}
                            onChange={(e) => {
                              // Update the editing state with the new value
                              setEditingAttributeValues(prev => ({
                                ...prev,
                                [`${attr.name}-${item}`]: e.currentTarget.value
                              }));
                            }}
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const currentValue = editingAttributeValues[`${attr.name}-${item}`] || item;
                              saveEditedAttributeValue(attr.name, item, currentValue);
                            }}
                            style={{
                              background: "#10b981",
                              border: "none",
                              borderRadius: "4px",
                              padding: "0.2rem 0.4rem",
                              marginLeft: "0.2rem",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center"
                            }}
                            title="Save"
                          >
                            <Check size={12} color="white" />
                          </button>
                          <button
                            type="button"
                            onClick={() => cancelEditingAttributeValue(attr.name, item)}
                            style={{
                              background: "#ef4444",
                              border: "none",
                              borderRadius: "4px",
                              padding: "0.2rem 0.4rem",
                              marginLeft: "0.2rem",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center"
                            }}
                            title="Cancel"
                          >
                            <X size={12} color="white" />
                          </button>
                        </>
                      ) : (
                        <>
                          {item}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditingAttributeValue(attr.name, item);
                            }}
                            style={{
                              background: "none",
                              border: "none",
                              marginLeft: "0.3rem",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center"
                            }}
                            title={`Edit '${item}'`}
                          >
                            <Edit size={12} color={isSelected ? "#fff" : "#7c3aed"} />
                          </button>
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();

                              showDelete(
                                "Delete Attribute Value",
                                `Delete "${item}" from ${attr.displayName}?`,
                                async () => {
                                  try {
                                    // Delete from database first
                                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/${selectedMainCategory}/attributes/${attr.name}/items/${encodeURIComponent(item)}`, {
                                      method: 'DELETE',
                                      headers: {
                                        'Content-Type': 'application/json'
                                      }
                                    });

                                    if (response.ok) {
                                      // Remove the item from the attribute
                                      const updatedAttributes = attributes.map(attribute => {
                                        if (attribute.name === attr.name) {
                                          return {
                                            ...attribute,
                                            items: attribute.items.filter(i => i !== item)
                                          };
                                        }
                                        return attribute;
                                      });
                                      setAttributes(updatedAttributes);
                                      
                                      // Also remove from selected values if it was selected
                                      if (selectedAttributeValues[attr.name] === item) {
                                        setSelectedAttributeValues(prev => {
                                          const newValues = { ...prev };
                                          delete newValues[attr.name];
                                          return newValues;
                                        });
                                      }
                                      
                                      showSuccess("Success", `"${item}" deleted successfully!`, () => {
                                        // Stay on the same page
                                      });
                                    } else {
                                      showError("Error", "Failed to delete from database. Please try again.");
                                    }
                                  } catch (error) {
                                    console.error('Error deleting attribute value:', error);
                                    showError("Error", "Error deleting attribute value. Please try again.");
                                  }
                                }
                              );

                              
                            }}
                            style={{
                              background: "none",
                              border: "none",
                              marginLeft: "0.2rem",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center"
                            }}
                            title={`Delete '${item}'`}
                          >
                            <Trash2 size={12} color={isSelected ? "#fff" : "#7c3aed"} />
                          </button>
                        </>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Products Display */}
      {!isProductForm && showProducts && selectedMainCategory && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Matching Products ({filteredProducts.length})
              </span>
              <Link href="/products/add">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Products Found</h3>
                <p className="text-gray-500 mb-4">No products match the selected category and filters.</p>
                <Link href="/products/add">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Product
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No Category Selected State */}
      {!selectedMainCategory && (
        <Card>
          <CardContent className="text-center py-12">
            <Folder className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Select a Main Category</h3>
            <p className="text-gray-500 mb-4">
              Choose a main category above to see relevant filters and subcategories.
            </p>
            {!isProductForm && (
              <p className="text-sm text-gray-400">
                You can also create new categories with custom attributes that will appear here automatically.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Selection Summary */}
      {selectedMainCategory && Object.values(currentSelectedFilters).flat().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Current Selections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="font-medium">
                  Main Category: {currentCategoryData?.name || selectedMainCategory || "No category selected"}
                </Badge>
              </div>
              {Object.entries(currentSelectedFilters).map(([filterType, items]) => {
                if (!items || items.length === 0) return null
                return (
                  <div key={filterType} className="space-y-2">
                    <Label className="text-sm font-medium capitalize">
                      {filterType.replace(/([A-Z])/g, " $1").trim()}:
                    </Label>
                    <div className="flex flex-wrap gap-1">
                      {items.map((item) => (
                        <Badge key={item} variant="outline" className="text-xs">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* After main category selection UI, show selected category's image and attributes */}
      {selectedMainCategory && categorySystem[selectedMainCategory] && (
        <div className="mb-8 p-4 border rounded-lg bg-white flex flex-col items-start">
          {/* Category Image */}
          {categorySystem[selectedMainCategory].imageUrl && (
            <img
              src={categorySystem[selectedMainCategory].imageUrl}
              alt={categorySystem[selectedMainCategory].name}
              style={{ width: "120px", height: "120px", objectFit: "cover", borderRadius: "8px", marginBottom: "1rem" }}
            />
          )}
          <h2 className="text-xl font-bold mb-2">{categorySystem[selectedMainCategory].name}</h2>
          {Array.isArray(categorySystem[selectedMainCategory].attributes) &&
            categorySystem[selectedMainCategory].attributes.length > 0 ? (
              categorySystem[selectedMainCategory].attributes.map((attr) => (
                <div key={attr.name} style={{ marginBottom: "1.5rem" }}>
                  <h3 style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>{attr.displayName}</h3>
                  
                  {/* Add new value input and button */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    <Input
                      placeholder={`Add new ${attr.displayName.toLowerCase()}...`}
                      style={{ 
                        width: "200px", 
                        height: "36px", 
                        fontSize: "0.875rem",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        padding: "0.5rem 0.75rem"
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.currentTarget.value.trim()) {
                          addAttributeValueToCategory(attr.name, e.currentTarget.value.trim());
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={(e) => {
                        const input = e.currentTarget.parentElement.querySelector("input");
                        if (input && input.value.trim()) {
                          addAttributeValueToCategory(attr.name, input.value.trim());
                          input.value = "";
                        }
                      }}
                      style={{
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        border: "none",
                        borderRadius: "6px",
                        padding: "0.5rem 1rem",
                        color: "white",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        transition: "all 0.2s ease",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-1px)";
                        e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
                      }}
                    >
                      <Plus size={16} />
                      Add
                    </Button>
                  </div>
                  
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {attr.items.map((item) => {
                      const isEditing = editingAttributeValues[`${attr.name}-${item}`];
                      const isSelected = Array.isArray(selectedAttributeValues[attr.name]) && selectedAttributeValues[attr.name].includes(item);
                      return (
                        <span
                          key={item}
                          onClick={() => !isEditing && handleAttributeValueSelect(attr.name, item)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            background: isSelected ? "#a78bfa" : "#f3f3f3",
                            color: isSelected ? "#fff" : "#000",
                            borderRadius: "8px",
                            padding: "0.25rem 0.75rem",
                            fontSize: "0.95rem",
                            cursor: isEditing ? "default" : "pointer",
                            border: isSelected ? "2px solid #7c3aed" : "none",
                            transition: "all 0.2s",
                            marginRight: "0.5rem"
                          }}
                        >
                          {isEditing ? (
                            <>
                              <input
                                type="text"
                                defaultValue={item}
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  color: "inherit",
                                  fontSize: "inherit",
                                  outline: "none",
                                  width: "80px",
                                  marginRight: "0.5rem"
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    saveEditedAttributeValue(attr.name, item, e.currentTarget.value);
                                  } else if (e.key === "Escape") {
                                    cancelEditingAttributeValue(attr.name, item);
                                  }
                                }}
                                onChange={(e) => {
                                  // Update the editing state with the new value
                                  setEditingAttributeValues(prev => ({
                                    ...prev,
                                    [`${attr.name}-${item}`]: e.currentTarget.value
                                  }));
                                }}
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const currentValue = editingAttributeValues[`${attr.name}-${item}`] || item;
                                  saveEditedAttributeValue(attr.name, item, currentValue);
                                }}
                                style={{
                                  background: "#10b981",
                                  border: "none",
                                  borderRadius: "4px",
                                  padding: "0.2rem 0.4rem",
                                  marginLeft: "0.2rem",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center"
                                }}
                                title="Save"
                              >
                                <Check size={12} color="white" />
                              </button>
                              <button
                                type="button"
                                onClick={() => cancelEditingAttributeValue(attr.name, item)}
                                style={{
                                  background: "#ef4444",
                                  border: "none",
                                  borderRadius: "4px",
                                  padding: "0.2rem 0.4rem",
                                                                   marginLeft: "0.2rem",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center"
                                }}
                                title="Cancel"
                              >
                                <X size={12} color="white" />
                              </button>
                            </>
                          ) : (
                            <>
                              {item}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditingAttributeValue(attr.name, item);
                                }}
                                style={{
                                  background: "none",
                                  border: "none",
                                  marginLeft: "0.3rem",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center"
                                }}
                                title={`Edit '${item}'`}
                              >
                                <Edit size={12} color={isSelected ? "#fff" : "#7c3aed"} />
                              </button>
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (confirm(`Delete "${item}" from ${attr.displayName}?`)) {
                                    try {
                                      // Delete from database first
                                      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/${selectedMainCategory}/attributes/${attr.name}/items/${encodeURIComponent(item)}`, {
                                        method: 'DELETE',
                                        headers: {
                                          'Content-Type': 'application/json'
                                        }
                                      });

                                      if (response.ok) {
                                        // Remove the item from the category system
                                        const updatedCategorySystem = { ...categorySystem };
                                        const category = updatedCategorySystem[selectedMainCategory];
                                        if (category && category.attributes) {
                                          const updatedAttributes = category.attributes.map(attribute => {
                                            if (attribute.name === attr.name) {
                                              return {
                                                ...attribute,
                                                items: attribute.items.filter(i => i !== item)
                                              };
                                            }
                                            return attribute;
                                          });
                                          updatedCategorySystem[selectedMainCategory] = {
                                            ...category,
                                            attributes: updatedAttributes
                                          };
                                          setCategorySystem(updatedCategorySystem);
                                          
                                          // Also remove from selected values if it was selected
                                          if (selectedAttributeValues[attr.name] === item) {
                                            setSelectedAttributeValues(prev => {
                                              const newValues = { ...prev };
                                              delete newValues[attr.name];
                                              return newValues;
                                            });
                                          }
                                        }
                                      } else {
                                        alert('Failed to delete from database. Please try again.');
                                      }
                                    } catch (error) {
                                      console.error('Error deleting attribute value:', error);
                                      alert('Error deleting attribute value. Please try again.');
                                    }
                                  }
                                }}
                                style={{
                                  background: "none",
                                  border: "none",
                                  marginLeft: "0.2rem",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center"
                                }}
                                title={`Delete '${item}'`}
                              >
                                <Trash2 size={12} color={isSelected ? "#fff" : "#7c3aed"} />
                              </button>
                            </>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No attributes for this category.</p>
            )}

          {/* Show all selected attribute-value pairs and clear button */}
          {Object.keys(selectedAttributeValues).length > 0 && (
            <div style={{ marginTop: "1.5rem", width: "100%" }}>
              <div style={{ marginBottom: "0.5rem" }}>
                <strong>Selected Values:</strong>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "0.75rem" }}>
                {Object.entries(selectedAttributeValues).map(([attr, values]) => (
                  <span key={attr} style={{ background: "#ede9fe", borderRadius: "8px", padding: "0.25rem 0.75rem", fontWeight: 500 }}>
                    {categorySystem[selectedMainCategory].attributes.find(a => a.name === attr)?.displayName || attr}: {values.join(', ')}
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setSelectedAttributeValues({})}
                style={{ background: "#a78bfa", color: "#fff", border: "none", borderRadius: "6px", padding: "0.5rem 1.25rem", cursor: "pointer" }}
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      )}

      {showProducts && (
        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <p>No products found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map(product => (
                  <div key={product._id} className="border p-4 rounded">
                    <img
                      src={product.imageUrl || "/placeholder.svg"}
                      alt={product.name}
                      style={{ width: "100%", height: 150, objectFit: "cover" }}
                    />
                    <h3 className="font-bold mt-2">{product.name}</h3>
                    <p>{product.description}</p>
                    <p className="text-sm text-gray-500">Price: ${product.price}</p>
                    {/* Add more product details as needed */}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}


      {/* Custom Modal */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        onCancel={closeModal}
        title={config.title}
        message={config.message}
        type={config.type}
        onConfirm={config.onConfirm}
        confirmText={config.confirmText}
        cancelText={config.cancelText}
        showCancel={config.showCancel}
      >
        {config.children}
      </Modal>

    </div>
  )
}
