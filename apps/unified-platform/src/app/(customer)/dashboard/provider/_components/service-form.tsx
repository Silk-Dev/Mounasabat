import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Upload } from 'lucide-react';
import { Service } from '../page';

'use client';


interface ServiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: Service | null;
  onSubmit: (data: Omit<Service, 'id' | 'createdAt' | 'status'>) => Promise<void>;
}

const SERVICE_CATEGORIES = [
  'Traiteur',
  'Photographie',
  'Musique & DJ',
  'Décoration',
  'Animation',
  'Location de matériel',
  'Transport',
  'Fleuriste',
  'Autre'
];

export function ServiceForm({ open, onOpenChange, service, onSubmit }: ServiceFormProps) {
  const [formData, setFormData] = useState({
    title: service?.title || '',
    description: service?.description || '',
    category: service?.category || '',
    price: service?.price?.toString() || '',
    images: service?.images || []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageInput, setImageInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        price: formData.price ? parseFloat(formData.price) : null,
        images: formData.images
      });
      
      // Reset form if creating new service
      if (!service) {
        setFormData({
          title: '',
          description: '',
          category: '',
          price: '',
          images: []
        });
        setImageInput('');
      }
    } catch (error) {
      console.error('Error submitting service:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addImage = () => {
    if (imageInput.trim() && !formData.images.includes(imageInput.trim())) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, imageInput.trim()]
      }));
      setImageInput('');
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      onOpenChange(newOpen);
      if (!newOpen && !service) {
        // Reset form when closing for new service
        setFormData({
          title: '',
          description: '',
          category: '',
          price: '',
          images: []
        });
        setImageInput('');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" data-testid="service-form-dialog">
        <DialogHeader>
          <DialogTitle>
            {service ? 'Modifier le service' : 'Ajouter un nouveau service'}
          </DialogTitle>
          <DialogDescription>
            {service 
              ? 'Modifiez les informations de votre service.'
              : 'Ajoutez un nouveau service à votre catalogue.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Titre du service *</Label>
            <Input
              id="title"
              data-testid="service-title-input"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Photographie de mariage"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Catégorie *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              required
            >
              <SelectTrigger data-testid="service-category-select">
                <SelectValue placeholder="Sélectionnez une catégorie" />
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

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              data-testid="service-description-input"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Décrivez votre service en détail..."
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Prix (MAD)</Label>
            <Input
              id="price"
              data-testid="service-price-input"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
              placeholder="Ex: 1500.00"
            />
            <p className="text-xs text-muted-foreground">
              Laissez vide si le prix est sur devis
            </p>
          </div>

          <div className="space-y-4">
            <Label>Images</Label>
            
            <div className="flex space-x-2">
              <Input
                data-testid="image-url-input"
                value={imageInput}
                onChange={(e) => setImageInput(e.target.value)}
                placeholder="URL de l'image"
                className="flex-1"
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={addImage}
                data-testid="add-image-button"
              >
                <Upload className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </div>

            {formData.images.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Images ajoutées ({formData.images.length})
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                        <img
                          src={image}
                          alt={`Image ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                        <div className="hidden w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                          Image non disponible
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                        data-testid={`remove-image-${index}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
              data-testid="cancel-button"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.title || !formData.category || !formData.description}
              data-testid="submit-button"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current mr-2"></div>
                  {service ? 'Modification...' : 'Ajout...'}
                </>
              ) : (
                service ? 'Modifier' : 'Ajouter'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}