'use client';

import React, { useState, useEffect } from 'react';
import { Save, Bell, Search, Shield, Globe, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { UserPreferences } from '@/types';
import { useUserPreferences } from '@/lib/hooks/useUserPreferences';
import { toast } from 'sonner';
import { logger } from '@/lib/production-logger';

interface CategorySelectorProps {
    selectedCategories: string[];
    onCategoriesChange: (categories: string[]) => void;
}

function CategorySelector({ selectedCategories, onCategoriesChange }: CategorySelectorProps) {
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const response = await fetch('/api/categories');
                if (response.ok) {
                    const data = await response.json();
                    setCategories(data.categories.map((cat: any) => cat.name));
                } else {
                    // Fallback to default categories if API fails
                    setCategories([
                        'Wedding Planning',
                        'Catering',
                        'Photography',
                        'Venues',
                        'Entertainment',
                        'Decoration',
                        'Transportation',
                        'Beauty & Wellness'
                    ]);
                }
            } catch (error) {
                logger.error('Failed to load categories:', error);
                // Fallback to default categories
                setCategories([
                    'Wedding Planning',
                    'Catering',
                    'Photography',
                    'Venues',
                    'Entertainment',
                    'Decoration',
                    'Transportation',
                    'Beauty & Wellness'
                ]);
            } finally {
                setLoading(false);
            }
        };

        loadCategories();
    }, []);

    if (loading) {
        return <div className="text-sm text-gray-500">Loading categories...</div>;
    }

    return (
        <div className="grid grid-cols-2 gap-2">
            {categories.map((category) => (
                <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                        id={category}
                        checked={selectedCategories.includes(category)}
                        onCheckedChange={(checked) => {
                            const updated = checked
                                ? [...selectedCategories, category]
                                : selectedCategories.filter(c => c !== category);
                            onCategoriesChange(updated);
                        }}
                    />
                    <Label htmlFor={category} className="text-sm">
                        {category}
                    </Label>
                </div>
            ))}
        </div>
    );
}

interface UserPreferencesProps {
    userId: string;
}

export function UserPreferencesComponent({ userId }: UserPreferencesProps) {
    const { preferences, loading, updatePreferences } = useUserPreferences(userId);
    const [formData, setFormData] = useState<Partial<UserPreferences>>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (preferences) {
            setFormData(preferences);
        }
    }, [preferences]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updatePreferences(formData);
            toast.success('Preferences saved successfully');
        } catch (error) {
            toast.error('Failed to save preferences');
        } finally {
            setIsSaving(false);
        }
    };

    const updateFormData = (path: string, value: any) => {
        setFormData(prev => {
            const keys = path.split('.');
            const newData = { ...prev };
            let current: any = newData;

            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) {
                    current[keys[i]] = {};
                }
                current = current[keys[i]];
            }

            current[keys[keys.length - 1]] = value;
            return newData;
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">User Preferences</h2>
                    <p className="text-gray-600">Customize your experience on the platform</p>
                </div>

                <Button onClick={handleSave} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* General Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="h-5 w-5" />
                            General Settings
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="language">Language</Label>
                            <Select
                                value={formData.language || 'en'}
                                onValueChange={(value) => updateFormData('language', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select language" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="en">English</SelectItem>
                                    <SelectItem value="fr">Français</SelectItem>
                                    <SelectItem value="ar">العربية</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="currency">Currency</Label>
                            <Select
                                value={formData.currency || 'USD'}
                                onValueChange={(value) => updateFormData('currency', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="USD">USD ($)</SelectItem>
                                    <SelectItem value="EUR">EUR (€)</SelectItem>
                                    <SelectItem value="TND">TND (د.ت)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Notification Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            Notifications
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="email-notifications">Email Notifications</Label>
                                <p className="text-sm text-gray-500">Receive updates via email</p>
                            </div>
                            <Switch
                                id="email-notifications"
                                checked={formData.notifications?.email || false}
                                onCheckedChange={(checked) => updateFormData('notifications.email', checked)}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="sms-notifications">SMS Notifications</Label>
                                <p className="text-sm text-gray-500">Receive updates via SMS</p>
                            </div>
                            <Switch
                                id="sms-notifications"
                                checked={formData.notifications?.sms || false}
                                onCheckedChange={(checked) => updateFormData('notifications.sms', checked)}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="push-notifications">Push Notifications</Label>
                                <p className="text-sm text-gray-500">Receive browser notifications</p>
                            </div>
                            <Switch
                                id="push-notifications"
                                checked={formData.notifications?.push || false}
                                onCheckedChange={(checked) => updateFormData('notifications.push', checked)}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="marketing-notifications">Marketing Communications</Label>
                                <p className="text-sm text-gray-500">Receive promotional content</p>
                            </div>
                            <Switch
                                id="marketing-notifications"
                                checked={formData.notifications?.marketing || false}
                                onCheckedChange={(checked) => updateFormData('notifications.marketing', checked)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Search Preferences */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Search className="h-5 w-5" />
                            Search Preferences
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="default-location">Default Location</Label>
                            <Input
                                id="default-location"
                                placeholder="Enter your default location"
                                value={formData.searchPreferences?.defaultLocation || ''}
                                onChange={(e) => updateFormData('searchPreferences.defaultLocation', e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Preferred Categories</Label>
                            <CategorySelector
                                selectedCategories={formData.searchPreferences?.preferredCategories || []}
                                onCategoriesChange={(categories) =>
                                    updateFormData('searchPreferences.preferredCategories', categories)
                                }
                            />
                        </div>


                        <div className="space-y-2">
                            <Label>Default Price Range</Label>
                            <div className="px-2">
                                <Slider
                                    value={formData.searchPreferences?.priceRange || [0, 1000]}
                                    onValueChange={(value) => updateFormData('searchPreferences.priceRange', value)}
                                    max={5000}
                                    step={50}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-sm text-gray-500 mt-1">
                                    <span>${formData.searchPreferences?.priceRange?.[0] || 0}</span>
                                    <span>${formData.searchPreferences?.priceRange?.[1] || 1000}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="sort-by">Default Sort By</Label>
                            <Select
                                value={formData.searchPreferences?.sortBy || 'popularity'}
                                onValueChange={(value) => updateFormData('searchPreferences.sortBy', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select default sorting" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="popularity">Popularity</SelectItem>
                                    <SelectItem value="price">Price</SelectItem>
                                    <SelectItem value="rating">Rating</SelectItem>
                                    <SelectItem value="distance">Distance</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Privacy Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Privacy Settings
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="profile-visible">Profile Visibility</Label>
                                <p className="text-sm text-gray-500">Make your profile visible to others</p>
                            </div>
                            <Switch
                                id="profile-visible"
                                checked={formData.privacy?.profileVisible || false}
                                onCheckedChange={(checked) => updateFormData('privacy.profileVisible', checked)}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="show-reviews">Show My Reviews</Label>
                                <p className="text-sm text-gray-500">Display your reviews publicly</p>
                            </div>
                            <Switch
                                id="show-reviews"
                                checked={formData.privacy?.showReviews || false}
                                onCheckedChange={(checked) => updateFormData('privacy.showReviews', checked)}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="allow-messages">Allow Messages</Label>
                                <p className="text-sm text-gray-500">Allow providers to message you</p>
                            </div>
                            <Switch
                                id="allow-messages"
                                checked={formData.privacy?.allowMessages || false}
                                onCheckedChange={(checked) => updateFormData('privacy.allowMessages', checked)}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}