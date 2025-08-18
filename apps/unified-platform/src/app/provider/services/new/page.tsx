'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import { Textarea } from '@/components/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { Label } from '@/components/ui';
import { Switch } from '@/components/ui';
import { Badge } from '@/components/ui';
import { ArrowLeft, Plus, X, Upload } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { logger } from '@/lib/production-logger';
import { LoadingButton, FormLoadingOverlay } from '@/components/ui/loading';

const SERVICE_CATEGORIES = [
  'Wedding Planning',
  'Photography',
  'Videography',
  'Catering',
  'Venue',
  'Music & Entertainment',
  'Decoration',
  'Transportation',
  'Beauty & Wellness',
  'Other'
];

const PRICE_UNITS = [
  { value: 'hour', label: 'Per Hour' },
  { value: 'day', label: 'Per Day' },
  { value: 'event', label: 'Per Event' },
  { value: 'person', label: 'Per Person' },
  { value: 'package', label: 'Package Price' }
];

interface ServiceFormData {
  name: string;
  description: string;
  category: string;
  subcategory: string;
  pricingType: 'FIXED' | 'QUOTE';
  basePrice: number | null;
  priceUnit: string;
  location: string;
  coverageArea: string[];
  features: string[];
  images: string[];
  isActive: boolean;
}

export default function NewServicePage() {
  const router = useRouter();
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [newFeature, setNewFeature] = useState('');
  const [newCoverageArea, setNewCoverageArea] = useState('');
  
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    category: '',
    subcategory: '',
    pricingType: 'FIXED',
    basePrice: null,
    priceUnit: 'event',
    location: '',
    coverageArea: [],
    features: [],
    images: [],
    isActive: true
  });

  const handleInputChange = (field: keyof ServiceFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addFeature = () => {
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  const removeFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter(f => f !== feature)
    }));
  };

  const addCoverageArea = () => {
    if (newCoverageArea.trim() && !formData.coverageArea.includes(newCoverageArea.trim())) {
      setFormData(prev => ({
        ...prev,
        coverageArea: [...prev.coverageArea, newCoverageArea.trim()]
      }));
      setNewCoverageArea('');
    }
  };

  const removeCoverageArea = (area: string) => {
    setFormData(prev => ({
      ...prev,
      coverageArea: prev.coverageArea.filter(a => a !== area)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.pricingType === 'FIXED' && !formData.basePrice) {
      toast.error('Please set a base price for fixed pricing');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/provider/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Service created successfully!');
        router.push('/provider/services');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to create service');
      }
    } catch (error) {
      logger.error('Error creating service:', error);
      toast.error('Failed to create service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <Button variant="ghost" asChild className="mr-4">
          <Link href="/provider/services">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Services
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Create New Service</h1>
      </div>

      <FormLoadingOverlay isLoading={loading} message="Creating your service...">
        <form onSubmit={handleSubmit} className="max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Service Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Wedding Photography Package"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe your service in detail..."
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => handleInputChange('category', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {SERVICE_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="subcategory">Subcategory</Label>
                    <Input
                      id="subcategory"
                      value={formData.subcategory}
                      onChange={(e) => handleInputChange('subcategory', e.target.value)}
                      placeholder="e.g., Portrait Photography"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Pricing Type</Label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="pricingType"
                        value="FIXED"
                        checked={formData.pricingType === 'FIXED'}
                        onChange={(e) => handleInputChange('pricingType', e.target.value)}
                        className="mr-2"
                      />
                      Fixed Price
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="pricingType"
                        value="QUOTE"
                        checked={formData.pricingType === 'QUOTE'}
                        onChange={(e) => handleInputChange('pricingType', e.target.value)}
                        className="mr-2"
                      />
                      Quote Based
                    </label>
                  </div>
                </div>

                {formData.pricingType === 'FIXED' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="basePrice">Base Price (TND) *</Label>
                      <Input
                        id="basePrice"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.basePrice || ''}
                        onChange={(e) => handleInputChange('basePrice', parseFloat(e.target.value) || null)}
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <Label htmlFor="priceUnit">Price Unit</Label>
                      <Select
                        value={formData.priceUnit}
                        onValueChange={(value) => handleInputChange('priceUnit', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRICE_UNITS.map((unit) => (
                            <SelectItem key={unit.value} value={unit.value}>
                              {unit.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Location & Coverage */}
            <Card>
              <CardHeader>
                <CardTitle>Location & Coverage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="location">Primary Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="e.g., Tunis, Tunisia"
                  />
                </div>

                <div>
                  <Label>Coverage Areas</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newCoverageArea}
                      onChange={(e) => setNewCoverageArea(e.target.value)}
                      placeholder="Add coverage area"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCoverageArea())}
                    />
                    <Button type="button" onClick={addCoverageArea} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.coverageArea.map((area) => (
                      <Badge key={area} variant="secondary" className="flex items-center gap-1">
                        {area}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeCoverageArea(area)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle>Features & Highlights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Service Features</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      placeholder="Add a feature"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                    />
                    <Button type="button" onClick={addFeature} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.features.map((feature) => (
                      <Badge key={feature} variant="secondary" className="flex items-center gap-1">
                        {feature}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeFeature(feature)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Images */}
            <Card>
              <CardHeader>
                <CardTitle>Images</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600 mb-2">
                    Upload service images
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG up to 10MB each
                  </p>
                  <Button variant="outline" size="sm" className="mt-4">
                    Choose Files
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>Service Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="isActive">Active</Label>
                    <p className="text-sm text-muted-foreground">
                      Make this service available for booking
                    </p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              <LoadingButton 
                type="submit" 
                className="w-full" 
                loading={loading}
                loadingText="Creating..."
              >
                Create Service
              </LoadingButton>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/provider/services">
                  Cancel
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </form>
      </FormLoadingOverlay>
    </div>
  );
}