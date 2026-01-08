'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, useParams } from 'next/navigation';
import { generateProductDescription } from '@/lib/ai/generateDescription';
import { generateProductTags } from '@/lib/ai/generateTags';
import { generateProductEmbedding, updateProductEmbedding } from '@/lib/ai/semanticSearch';

export default function VendorProductUploadPage() {
  const router = useRouter();
  const params = useParams();
  const vendorId = params?.vendorId as string;

  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    category: 'general',
    districtTheme: 'tech',
    tags: '',
  });

  const handleAIGenerate = async () => {
    if (!formData.name || !formData.category) {
      alert('Please provide product name and category first');
      return;
    }

    setAiGenerating(true);
    try {
      const result = await generateProductDescription(
        formData.name,
        formData.category,
        formData.districtTheme
      );

      const tags = await generateProductTags(
        formData.name,
        result.longDescription,
        formData.districtTheme
      );

      setFormData({
        ...formData,
        description: result.longDescription,
        tags: tags.join(', '),
      });
    } catch (error) {
      console.error('AI generation error:', error);
      alert('Failed to generate AI content');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get vendor's microstore_id
      const { data: vendor } = await supabase
        .from('vendors')
        .select('microstore_id')
        .eq('id', vendorId)
        .single();

      if (!vendor) throw new Error('Vendor not found');

      const tagsArray = formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      // Create product
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          image_url: formData.imageUrl,
          tags: tagsArray,
          microstore_id: vendor.microstore_id,
        })
        .select()
        .single();

      if (productError) throw productError;

      // Generate and update embedding
      try {
        const embedding = await generateProductEmbedding(
          formData.name,
          formData.description,
          tagsArray
        );
        await updateProductEmbedding(product.id, embedding);
      } catch (embeddingError) {
        console.error('Failed to generate embedding:', embeddingError);
      }

      alert('Product added successfully!');
      router.push(`/admin/vendors/${vendorId}/products`);
    } catch (error) {
      console.error('Product upload error:', error);
      alert('Failed to upload product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Upload New Product
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                placeholder="Amazing Product"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="general">General</option>
                  <option value="tech">Technology</option>
                  <option value="fashion">Fashion</option>
                  <option value="food">Food</option>
                  <option value="eco">Eco-Friendly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  District Theme *
                </label>
                <select
                  name="districtTheme"
                  value={formData.districtTheme}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="tech">Tech District</option>
                  <option value="fashion">Fashion District</option>
                  <option value="food">Food District</option>
                  <option value="eco">Eco District</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Description *
                </label>
                <button
                  type="button"
                  onClick={handleAIGenerate}
                  disabled={aiGenerating}
                  className="px-3 py-1 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {aiGenerating ? 'Generating...' : '✨ AI Generate'}
                </button>
              </div>
              <textarea
                name="description"
                required
                value={formData.description}
                onChange={handleChange}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                placeholder="Product description..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (USD) *
              </label>
              <input
                type="number"
                name="price"
                required
                step="0.01"
                min="0"
                value={formData.price}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                placeholder="29.99"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image URL *
              </label>
              <input
                type="url"
                name="imageUrl"
                required
                value={formData.imageUrl}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                placeholder="tech, gadget, innovative"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? 'Uploading...' : 'Upload Product'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
