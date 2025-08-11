'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui';
import { Button } from '../ui';
import { Calendar } from '../ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui';
import { Badge } from '../ui';
import { Alert, AlertDescription } from '../ui';
import { Skeleton } from '../ui';
import { Calendar as CalendarIcon, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import type { SelectedService, AvailabilitySlot } from '../../types';

interface DateTimePickerProps {
  selectedServices: SelectedService[];
  selectedDate?: Date;
  selectedTime?: string;
  onDateTimeChange: (date: Date, time: string) => void;
  onValidationChange: (isValid: boolean) => void;
}

interface TimeSlot {
  time: string;
  available: boolean;
  conflictingBookings?: string[];
}

export function DateTimePicker({
  selectedServices,
  selectedDate,
  selectedTime,
  onDateTimeChange,
  onValidationChange
}: DateTimePickerProps) {
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string>('');
  const [isValid, setIsValid] = useState(false);

  // Generate time slots for a day (9 AM to 10 PM in 30-minute intervals)
  const generateTimeSlots = (): string[] => {
    const slots: string[] = [];
    for (let hour = 9; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  // Check availability for selected date
  const checkAvailability = async (date: Date) => {
    if (selectedServices.length === 0) return;

    setLoading(true);
    try {
      // Simulate API call to check availability
      // In real implementation, this would call the backend
      const providerIds = [...new Set(selectedServices.map(s => s.providerId))];
      
      // Mock availability data - in real app, this would come from API
      const mockAvailability: AvailabilitySlot[] = [];
      const baseSlots = generateTimeSlots();
      
      baseSlots.forEach(time => {
        // Simulate some unavailable slots
        const isAvailable = Math.random() > 0.3; // 70% availability
        mockAvailability.push({
          date,
          startTime: time,
          endTime: addMinutesToTime(time, 30),
          isAvailable,
          bookingId: isAvailable ? undefined : `booking-${Math.random().toString(36).substr(2, 9)}`
        });
      });

      setAvailableSlots(mockAvailability);
      
      // Process time slots with availability
      const processedTimeSlots: TimeSlot[] = baseSlots.map(time => {
        const slot = mockAvailability.find(s => s.startTime === time);
        return {
          time,
          available: slot?.isAvailable || false,
          conflictingBookings: slot?.bookingId ? [slot.bookingId] : undefined
        };
      });

      setTimeSlots(processedTimeSlots);
    } catch (error) {
      console.error('Error checking availability:', error);
      setValidationMessage('Error checking availability. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to add minutes to time string
  const addMinutesToTime = (timeString: string, minutes: number): string => {
    const [hours, mins] = timeString.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  };

  // Validate selected date and time
  const validateSelection = (date: Date, time: string) => {
    if (!date || !time) {
      setValidationMessage('Please select both date and time');
      setIsValid(false);
      onValidationChange(false);
      return;
    }

    const selectedDateTime = new Date(date);
    const [hours, minutes] = time.split(':').map(Number);
    selectedDateTime.setHours(hours, minutes, 0, 0);

    // Check if date is in the past
    if (selectedDateTime < new Date()) {
      setValidationMessage('Selected date and time cannot be in the past');
      setIsValid(false);
      onValidationChange(false);
      return;
    }

    // Check if date is too far in the future (e.g., more than 2 years)
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 2);
    if (selectedDateTime > maxDate) {
      setValidationMessage('Selected date cannot be more than 2 years in the future');
      setIsValid(false);
      onValidationChange(false);
      return;
    }

    // Check availability
    const timeSlot = timeSlots.find(slot => slot.time === time);
    if (!timeSlot?.available) {
      setValidationMessage('Selected time slot is not available');
      setIsValid(false);
      onValidationChange(false);
      return;
    }

    // Check if enough time for all services
    const totalDuration = selectedServices.reduce((sum, service) => sum + service.duration, 0);
    const endTime = addMinutesToTime(time, totalDuration * 60);
    const endHour = parseInt(endTime.split(':')[0]);
    
    if (endHour > 23) {
      setValidationMessage(`Services require ${totalDuration} hours total. Please select an earlier time.`);
      setIsValid(false);
      onValidationChange(false);
      return;
    }

    setValidationMessage('Date and time are available');
    setIsValid(true);
    onValidationChange(true);
  };

  // Effect to check availability when date changes
  useEffect(() => {
    if (selectedDate) {
      checkAvailability(selectedDate);
    }
  }, [selectedDate, selectedServices]);

  // Effect to validate when date or time changes
  useEffect(() => {
    if (selectedDate && selectedTime) {
      validateSelection(selectedDate, selectedTime);
    }
  }, [selectedDate, selectedTime, timeSlots]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onDateTimeChange(date, selectedTime || '');
    }
  };

  const handleTimeSelect = (time: string) => {
    if (selectedDate) {
      onDateTimeChange(selectedDate, time);
    }
  };

  const isDateDisabled = (date: Date) => {
    // Disable past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const formatDuration = (hours: number) => {
    if (hours === 1) return '1 hour';
    if (hours < 24) return `${hours} hours`;
    return `${Math.floor(hours / 24)} day${Math.floor(hours / 24) > 1 ? 's' : ''}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Select Date & Time</h2>
        <p className="text-gray-600">Choose when you need the services</p>
      </div>

      {selectedServices.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please select services first before choosing date and time.
          </AlertDescription>
        </Alert>
      )}

      {selectedServices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Service Duration Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedServices.map((service) => (
                <div key={service.serviceId} className="flex justify-between items-center">
                  <span>{service.service.name}</span>
                  <Badge variant="outline">{formatDuration(service.duration)}</Badge>
                </div>
              ))}
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between items-center font-medium">
                  <span>Total Duration:</span>
                  <Badge>
                    {formatDuration(selectedServices.reduce((sum, service) => sum + service.duration, 0))}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Date Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Date</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={isDateDisabled}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Time Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Select Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedDate ? (
              <p className="text-gray-500 text-center py-8">
                Please select a date first
              </p>
            ) : loading ? (
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {timeSlots.map((slot) => (
                  <Button
                    key={slot.time}
                    variant={selectedTime === slot.time ? "default" : "outline"}
                    className={`w-full justify-start ${
                      !slot.available 
                        ? 'opacity-50 cursor-not-allowed' 
                        : selectedTime === slot.time 
                        ? 'bg-blue-600 text-white' 
                        : 'hover:bg-blue-50'
                    }`}
                    onClick={() => slot.available && handleTimeSelect(slot.time)}
                    disabled={!slot.available}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{slot.time}</span>
                      {!slot.available && (
                        <Badge variant="destructive" className="text-xs">
                          Unavailable
                        </Badge>
                      )}
                      {slot.available && selectedTime === slot.time && (
                        <CheckCircle className="w-4 h-4" />
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Validation Message */}
      {validationMessage && (
        <Alert className={isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          {isValid ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={isValid ? 'text-green-800' : 'text-red-800'}>
            {validationMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Selected Summary */}
      {selectedDate && selectedTime && isValid && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <h3 className="font-bold text-lg mb-2 text-green-800">Selected Schedule</h3>
            <div className="space-y-1 text-green-700">
              <p><strong>Date:</strong> {selectedDate.toLocaleDateString()}</p>
              <p><strong>Start Time:</strong> {selectedTime}</p>
              <p><strong>End Time:</strong> {addMinutesToTime(selectedTime, selectedServices.reduce((sum, service) => sum + service.duration, 0) * 60)}</p>
              <p><strong>Total Duration:</strong> {formatDuration(selectedServices.reduce((sum, service) => sum + service.duration, 0))}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}