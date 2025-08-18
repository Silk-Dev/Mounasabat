'use client';

import React, { useState, useEffect } from 'react';
import { AvailabilitySlot } from '@/types';
import { Button, Badge } from '@/components/ui';
import { ChevronLeft, ChevronRight, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import { logger } from '@/lib/production-logger';

interface AvailabilityCalendarProps {
  providerId: string;
  className?: string;
  onDateSelect?: (date: Date, slots: AvailabilitySlot[]) => void;
}

const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({ 
  providerId, 
  className = '',
  onDateSelect 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availabilityData, setAvailabilityData] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch availability data from API
  const fetchAvailability = async (date: Date, providerId: string) => {
    try {
      const response = await fetch(`/api/providers/${providerId}/availability?month=${date.getMonth() + 1}&year=${date.getFullYear()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch availability');
      }
      const data = await response.json();
      return data.availability || [];
    } catch (error) {
      logger.error('Error fetching availability:', error);
      return [];
    }
  };

  useEffect(() => {
    const loadAvailability = async () => {
      setLoading(true);
      try {
        const availability = await fetchAvailability(currentDate, providerId);
        setAvailabilityData(availability);
      } catch (error) {
        logger.error('Failed to load availability:', error);
        setAvailabilityData([]);
      } finally {
        setLoading(false);
      }
    };

    loadAvailability();
  }, [currentDate, providerId]);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const getAvailabilityForDate = (date: Date) => {
    return availabilityData.filter(slot => isSameDay(slot.date, date));
  };

  const getDateStatus = (date: Date) => {
    const slots = getAvailabilityForDate(date);
    if (slots.length === 0) return 'unavailable';
    
    const hasAvailable = slots.some(slot => slot.isAvailable);
    const hasBooked = slots.some(slot => !slot.isAvailable);
    
    if (hasAvailable && hasBooked) return 'partial';
    if (hasAvailable) return 'available';
    return 'booked';
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
    setSelectedDate(null);
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (clickedDate < today) return; // Don't allow past dates
    
    setSelectedDate(clickedDate);
    const slots = getAvailabilityForDate(clickedDate);
    onDateSelect?.(clickedDate, slots);
  };

  const formatMonth = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', { 
      month: 'long', 
      year: 'numeric' 
    }).format(date);
  };

  const formatTime = (time: string) => {
    return time;
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const isPast = date < today;
      const isSelected = selectedDate && isSameDay(date, selectedDate);
      const status = getDateStatus(date);
      
      let dayClasses = 'h-10 w-10 rounded-lg flex items-center justify-center text-sm font-medium cursor-pointer transition-colors relative ';
      
      if (isPast) {
        dayClasses += 'text-gray-300 cursor-not-allowed ';
      } else if (isSelected) {
        dayClasses += 'bg-blue-600 text-white ';
      } else {
        switch (status) {
          case 'available':
            dayClasses += 'text-green-600 hover:bg-green-50 ';
            break;
          case 'partial':
            dayClasses += 'text-yellow-600 hover:bg-yellow-50 ';
            break;
          case 'booked':
            dayClasses += 'text-red-600 hover:bg-red-50 ';
            break;
          default:
            dayClasses += 'text-gray-400 hover:bg-gray-50 ';
        }
      }
      
      days.push(
        <div
          key={day}
          className={dayClasses}
          onClick={() => !isPast && handleDateClick(day)}
        >
          {day}
          {!isPast && status !== 'unavailable' && (
            <div className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ${
              status === 'available' ? 'bg-green-500' :
              status === 'partial' ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
          )}
        </div>
      );
    }
    
    return days;
  };

  const selectedDateSlots = selectedDate ? getAvailabilityForDate(selectedDate) : [];

  return (
    <div className={className}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Availability
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateMonth('prev')}
            disabled={loading}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium min-w-[120px] text-center">
            {formatMonth(currentDate)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateMonth('next')}
            disabled={loading}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="mb-4">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {loading ? (
            Array.from({ length: 42 }, (_, i) => (
              <div key={i} className="h-10 w-10 rounded-lg bg-gray-100 animate-pulse"></div>
            ))
          ) : (
            renderCalendarDays()
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 text-xs mb-4">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span>Partial</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>Booked</span>
        </div>
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {new Intl.DateTimeFormat('fr-FR', { 
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }).format(selectedDate)}
          </h4>
          
          {selectedDateSlots.length > 0 ? (
            <div className="space-y-2">
              {selectedDateSlots.map((slot, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    slot.isAvailable 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {slot.isAvailable ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className="text-sm font-medium">
                      {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                    </span>
                  </div>
                  <Badge variant={slot.isAvailable ? "default" : "destructive"}>
                    {slot.isAvailable ? 'Available' : 'Booked'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500 text-sm">
              No availability information for this date
            </div>
          )}
        </div>
      )}

      {/* Book Button */}
      {selectedDate && selectedDateSlots.some(slot => slot.isAvailable) && (
        <div className="mt-4">
          <Button className="w-full">
            Book for {new Intl.DateTimeFormat('fr-FR', { 
              month: 'short',
              day: 'numeric'
            }).format(selectedDate)}
          </Button>
        </div>
      )}
    </div>
  );
};

export default AvailabilityCalendar;