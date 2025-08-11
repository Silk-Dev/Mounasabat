'use client';

import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { websocketService, AvailabilityUpdate } from '@/lib/websocket';
import { format, parseISO, isSameDay } from 'date-fns';

interface TimeSlot {
  time: string;
  available: boolean;
  bookingId?: string;
}

interface AvailabilityData {
  [date: string]: TimeSlot[];
}

interface RealTimeAvailabilityProps {
  providerId: string;
  serviceId?: string;
  onSlotSelect?: (date: Date, time: string) => void;
  selectedDate?: Date;
  selectedTime?: string;
}

export function RealTimeAvailability({
  providerId,
  serviceId,
  onSlotSelect,
  selectedDate,
  selectedTime
}: RealTimeAvailabilityProps) {
  const [availability, setAvailability] = useState<AvailabilityData>({});
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(selectedDate);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');

  useEffect(() => {
    // Load initial availability data
    loadAvailability();

    // Set up WebSocket connection
    const userId = 'current-user-id'; // Get from auth context
    const userRole = 'customer'; // Get from auth context
    
    websocketService.connect(userId, userRole);
    
    // Subscribe to availability updates
    const unsubscribe = websocketService.subscribe('availability_update', handleAvailabilityUpdate);

    // Monitor connection status
    const checkConnection = setInterval(() => {
      setConnectionStatus(websocketService.isConnected() ? 'connected' : 'disconnected');
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(checkConnection);
    };
  }, [providerId, serviceId]);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/provider/${providerId}/availability${serviceId ? `?serviceId=${serviceId}` : ''}`);
      if (response.ok) {
        const data = await response.json();
        setAvailability(data.availability || {});
      }
    } catch (error) {
      console.error('Failed to load availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvailabilityUpdate = (update: AvailabilityUpdate) => {
    if (update.providerId !== providerId) return;
    if (serviceId && update.serviceId !== serviceId) return;

    setAvailability(prev => ({
      ...prev,
      [update.date]: update.slots?.map(time => ({
        time,
        available: update.available
      })) || []
    }));
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDay(date);
  };

  const handleTimeSelect = (time: string) => {
    if (selectedDay && onSlotSelect) {
      onSlotSelect(selectedDay, time);
    }
  };

  const getAvailableSlots = (date: Date): TimeSlot[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return availability[dateStr] || [];
  };

  const isDateAvailable = (date: Date): boolean => {
    const slots = getAvailableSlots(date);
    return slots.some(slot => slot.available);
  };

  const selectedDaySlots = selectedDay ? getAvailableSlots(selectedDay) : [];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Availability</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Real-time Availability</CardTitle>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-500' : 
            connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
          }`} />
          <span className="text-sm text-muted-foreground capitalize">
            {connectionStatus}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Calendar
              mode="single"
              selected={selectedDay}
              onSelect={handleDateSelect}
              disabled={(date) => date < new Date() || !isDateAvailable(date)}
              className="rounded-md border"
              modifiers={{
                available: (date) => isDateAvailable(date),
                unavailable: (date) => date >= new Date() && !isDateAvailable(date)
              }}
              modifiersStyles={{
                available: { backgroundColor: '#dcfce7' },
                unavailable: { backgroundColor: '#fef2f2', color: '#991b1b' }
              }}
            />
          </div>

          <div>
            <h4 className="font-medium mb-3">
              {selectedDay ? format(selectedDay, 'EEEE, MMMM d') : 'Select a date'}
            </h4>
            
            {selectedDay && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {selectedDaySlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No time slots available for this date
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {selectedDaySlots.map((slot) => (
                      <Button
                        key={slot.time}
                        variant={selectedTime === slot.time ? "default" : "outline"}
                        size="sm"
                        disabled={!slot.available}
                        onClick={() => handleTimeSelect(slot.time)}
                        className="justify-start"
                      >
                        <span>{slot.time}</span>
                        {!slot.available && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            Booked
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
            <span>Unavailable</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
            <span>Past dates</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}