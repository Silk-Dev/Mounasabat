'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Input } from '@/components/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { Switch } from '@/components/ui';
import { 
  Calendar,
  Clock,
  Plus,
  X,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

interface DayAvailability {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  dayName: string;
  isEnabled: boolean;
  timeSlots: TimeSlot[];
}

interface SpecialDate {
  id: string;
  date: string;
  isAvailable: boolean;
  reason?: string;
  timeSlots?: TimeSlot[];
}

export default function ProviderAvailabilityPage() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [weeklySchedule, setWeeklySchedule] = useState<DayAvailability[]>([]);
  const [specialDates, setSpecialDates] = useState<SpecialDate[]>([]);
  const [newSpecialDate, setNewSpecialDate] = useState('');
  const [newSpecialDateReason, setNewSpecialDateReason] = useState('');

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    if (session?.user) {
      initializeSchedule();
      fetchAvailability();
    }
  }, [session]);

  const initializeSchedule = () => {
    const defaultSchedule: DayAvailability[] = dayNames.map((dayName, index) => ({
      dayOfWeek: index,
      dayName,
      isEnabled: index >= 1 && index <= 5, // Monday to Friday enabled by default
      timeSlots: [
        {
          id: `${index}-morning`,
          startTime: '09:00',
          endTime: '12:00',
          isAvailable: true
        },
        {
          id: `${index}-afternoon`,
          startTime: '14:00',
          endTime: '18:00',
          isAvailable: true
        }
      ]
    }));
    setWeeklySchedule(defaultSchedule);
  };

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/provider/availability');
      if (response.ok) {
        const data = await response.json();
        if (data.weeklySchedule) {
          setWeeklySchedule(data.weeklySchedule);
        }
        if (data.specialDates) {
          setSpecialDates(data.specialDates);
        }
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveAvailability = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/provider/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weeklySchedule,
          specialDates
        }),
      });

      if (response.ok) {
        // Show success message
        alert('Availability updated successfully!');
      } else {
        alert('Failed to update availability');
      }
    } catch (error) {
      console.error('Error saving availability:', error);
      alert('Failed to update availability');
    } finally {
      setSaving(false);
    }
  };

  const toggleDayEnabled = (dayIndex: number) => {
    setWeeklySchedule(prev => prev.map(day => 
      day.dayOfWeek === dayIndex 
        ? { ...day, isEnabled: !day.isEnabled }
        : day
    ));
  };

  const addTimeSlot = (dayIndex: number) => {
    const newSlot: TimeSlot = {
      id: `${dayIndex}-${Date.now()}`,
      startTime: '09:00',
      endTime: '17:00',
      isAvailable: true
    };

    setWeeklySchedule(prev => prev.map(day => 
      day.dayOfWeek === dayIndex 
        ? { ...day, timeSlots: [...day.timeSlots, newSlot] }
        : day
    ));
  };

  const removeTimeSlot = (dayIndex: number, slotId: string) => {
    setWeeklySchedule(prev => prev.map(day => 
      day.dayOfWeek === dayIndex 
        ? { ...day, timeSlots: day.timeSlots.filter(slot => slot.id !== slotId) }
        : day
    ));
  };

  const updateTimeSlot = (dayIndex: number, slotId: string, field: keyof TimeSlot, value: any) => {
    setWeeklySchedule(prev => prev.map(day => 
      day.dayOfWeek === dayIndex 
        ? {
            ...day,
            timeSlots: day.timeSlots.map(slot => 
              slot.id === slotId 
                ? { ...slot, [field]: value }
                : slot
            )
          }
        : day
    ));
  };

  const addSpecialDate = () => {
    if (!newSpecialDate) return;

    const specialDate: SpecialDate = {
      id: Date.now().toString(),
      date: newSpecialDate,
      isAvailable: false,
      reason: newSpecialDateReason || 'Not available'
    };

    setSpecialDates(prev => [...prev, specialDate]);
    setNewSpecialDate('');
    setNewSpecialDateReason('');
  };

  const removeSpecialDate = (id: string) => {
    setSpecialDates(prev => prev.filter(date => date.id !== id));
  };

  const toggleSpecialDateAvailability = (id: string) => {
    setSpecialDates(prev => prev.map(date => 
      date.id === id 
        ? { ...date, isAvailable: !date.isAvailable }
        : date
    ));
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
          <div className="space-y-4">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Availability Management</h1>
        <div className="flex gap-4">
          <Button variant="outline" onClick={fetchAvailability}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={saveAvailability} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Schedule */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Weekly Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {weeklySchedule.map((day) => (
                <div key={day.dayOfWeek} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Switch
                        checked={day.isEnabled}
                        onCheckedChange={() => toggleDayEnabled(day.dayOfWeek)}
                      />
                      <h3 className="font-medium">{day.dayName}</h3>
                    </div>
                    {day.isEnabled && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addTimeSlot(day.dayOfWeek)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Time Slot
                      </Button>
                    )}
                  </div>

                  {day.isEnabled && (
                    <div className="space-y-3">
                      {day.timeSlots.map((slot) => (
                        <div key={slot.id} className="flex items-center space-x-3 bg-gray-50 p-3 rounded">
                          <div className="flex items-center space-x-2">
                            <Input
                              type="time"
                              value={slot.startTime}
                              onChange={(e) => updateTimeSlot(day.dayOfWeek, slot.id, 'startTime', e.target.value)}
                              className="w-32"
                            />
                            <span className="text-muted-foreground">to</span>
                            <Input
                              type="time"
                              value={slot.endTime}
                              onChange={(e) => updateTimeSlot(day.dayOfWeek, slot.id, 'endTime', e.target.value)}
                              className="w-32"
                            />
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={slot.isAvailable}
                              onCheckedChange={(checked) => updateTimeSlot(day.dayOfWeek, slot.id, 'isAvailable', checked)}
                            />
                            <span className="text-sm text-muted-foreground">Available</span>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTimeSlot(day.dayOfWeek, slot.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}

                      {day.timeSlots.length === 0 && (
                        <div className="text-center py-4 text-muted-foreground">
                          <Clock className="mx-auto h-8 w-8 mb-2" />
                          <p>No time slots configured</p>
                        </div>
                      )}
                    </div>
                  )}

                  {!day.isEnabled && (
                    <div className="text-center py-4 text-muted-foreground">
                      <AlertCircle className="mx-auto h-8 w-8 mb-2" />
                      <p>Not available on {day.dayName}</p>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Special Dates */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Special Dates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Input
                  type="date"
                  value={newSpecialDate}
                  onChange={(e) => setNewSpecialDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
                <Input
                  placeholder="Reason (optional)"
                  value={newSpecialDateReason}
                  onChange={(e) => setNewSpecialDateReason(e.target.value)}
                />
                <Button onClick={addSpecialDate} className="w-full" disabled={!newSpecialDate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Special Date
                </Button>
              </div>

              <div className="space-y-3">
                {specialDates.map((specialDate) => (
                  <div key={specialDate.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">
                        {new Date(specialDate.date).toLocaleDateString()}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSpecialDate(specialDate.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {specialDate.isAvailable ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm">
                          {specialDate.isAvailable ? 'Available' : 'Not Available'}
                        </span>
                      </div>
                      <Switch
                        checked={specialDate.isAvailable}
                        onCheckedChange={() => toggleSpecialDateAvailability(specialDate.id)}
                      />
                    </div>
                    
                    {specialDate.reason && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {specialDate.reason}
                      </p>
                    )}
                  </div>
                ))}

                {specialDates.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="mx-auto h-8 w-8 mb-2" />
                    <p className="text-sm">No special dates configured</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full">
                Copy Previous Week
              </Button>
              <Button variant="outline" className="w-full">
                Set Holiday Period
              </Button>
              <Button variant="outline" className="w-full">
                Reset to Default
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}