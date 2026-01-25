import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, Clock, Plus, Trash2, Loader2, 
  CalendarDays, Check, X, AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { format, addDays, startOfDay, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00',
  '14:00', '15:00', '16:00', '17:00'
];

export default function Schedules() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(null);
  const [newSlotTime, setNewSlotTime] = useState('');

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => base44.entities.Schedule.list('date'),
    refetchInterval: 10000
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Schedule.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['schedules']);
      toast.success('Horário adicionado!');
      setNewSlotTime('');
    },
    onError: (err) => toast.error('Erro', { description: err.message })
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Schedule.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['schedules']);
      toast.success('Horário removido');
    },
    onError: (err) => toast.error('Erro', { description: err.message })
  });

  const toggleBlockMutation = useMutation({
    mutationFn: async ({ id, blocked }) => {
      return await base44.entities.Schedule.update(id, { is_blocked: blocked });
    },
    onSuccess: (_, { blocked }) => {
      queryClient.invalidateQueries(['schedules']);
      toast.success(blocked ? 'Horário bloqueado' : 'Horário desbloqueado');
    }
  });

  const bulkCreateMutation = useMutation({
    mutationFn: async ({ date, times }) => {
      const existingForDate = schedules.filter(s => 
        s.date.split('T')[0] === date
      ).map(s => s.time);
      
      const newTimes = times.filter(t => !existingForDate.includes(t));
      
      if (newTimes.length === 0) {
        throw new Error('Todos os horários já existem para esta data');
      }
      
      return await base44.entities.Schedule.bulkCreate(
        newTimes.map(time => ({
          date,
          time,
          is_blocked: false,
          is_booked: false
        }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['schedules']);
      toast.success('Horários adicionados!');
    },
    onError: (err) => toast.error('Erro', { description: err.message })
  });

  // Generate next 14 days
  const next14Days = Array.from({ length: 14 }, (_, i) => {
    const date = addDays(new Date(), i);
    return {
      date,
      dateStr: format(date, 'yyyy-MM-dd'),
      dayName: format(date, 'EEE', { locale: ptBR }),
      dayNum: format(date, 'd'),
      monthName: format(date, 'MMM', { locale: ptBR })
    };
  });

  const getSchedulesForDate = (dateStr) => {
    return schedules.filter(s => s.date.split('T')[0] === dateStr)
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  const handleAddSlot = () => {
    if (!selectedDate || !newSlotTime) {
      toast.error('Selecione uma data e horário');
      return;
    }
    
    createMutation.mutate({
      date: selectedDate,
      time: newSlotTime,
      is_blocked: false,
      is_booked: false
    });
  };

  const handleAddAllSlots = (dateStr) => {
    bulkCreateMutation.mutate({
      date: dateStr,
      times: TIME_SLOTS
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
            Gerenciar Agendamentos
          </h1>
          <p className="text-slate-500 mt-1">
            Configure os horários disponíveis para entrega
          </p>
        </div>
      </div>

      {/* Calendar Strip */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-emerald-600" />
            Próximos 14 dias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {next14Days.map((day) => {
              const daySchedules = getSchedulesForDate(day.dateStr);
              const isSelected = selectedDate === day.dateStr;
              const availableCount = daySchedules.filter(s => !s.is_blocked && !s.is_booked).length;
              const bookedCount = daySchedules.filter(s => s.is_booked).length;
              
              return (
                <button
                  key={day.dateStr}
                  onClick={() => setSelectedDate(day.dateStr)}
                  className={`
                    flex-shrink-0 w-20 p-3 rounded-xl text-center transition-all
                    ${isSelected 
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700'}
                  `}
                >
                  <p className={`text-xs font-medium uppercase ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                    {day.dayName}
                  </p>
                  <p className="text-2xl font-bold">{day.dayNum}</p>
                  <p className={`text-xs ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                    {day.monthName}
                  </p>
                  {daySchedules.length > 0 && (
                    <div className="mt-2 flex justify-center gap-1">
                      {availableCount > 0 && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                          isSelected ? 'bg-emerald-500' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {availableCount}
                        </span>
                      )}
                      {bookedCount > 0 && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                          isSelected ? 'bg-blue-400' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {bookedCount}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Details */}
      <AnimatePresence mode="wait">
        {selectedDate && (
          <motion.div
            key={selectedDate}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {format(parseISO(selectedDate), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                    </CardTitle>
                    <CardDescription>
                      {getSchedulesForDate(selectedDate).length} horário(s) configurado(s)
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => handleAddAllSlots(selectedDate)}
                    disabled={bulkCreateMutation.isPending}
                    className="gap-2"
                  >
                    {bulkCreateMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    Adicionar todos os horários
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add new slot */}
                <div className="flex gap-2 p-4 bg-slate-50 rounded-lg">
                  <Select value={newSlotTime} onValueChange={setNewSlotTime}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Horário" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map(time => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={handleAddSlot}
                    disabled={createMutation.isPending || !newSlotTime}
                    className="gap-2"
                  >
                    {createMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    Adicionar
                  </Button>
                </div>

                {/* Slots list */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {getSchedulesForDate(selectedDate).map((schedule) => (
                    <motion.div
                      key={schedule.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`
                        p-4 rounded-xl border-2 transition-all
                        ${schedule.is_booked 
                          ? 'bg-blue-50 border-blue-200' 
                          : schedule.is_blocked 
                          ? 'bg-slate-100 border-slate-200' 
                          : 'bg-emerald-50 border-emerald-200'}
                      `}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className={`w-4 h-4 ${
                            schedule.is_booked 
                              ? 'text-blue-600' 
                              : schedule.is_blocked 
                              ? 'text-slate-400' 
                              : 'text-emerald-600'
                          }`} />
                          <span className="font-bold text-lg">{schedule.time}</span>
                        </div>
                        {!schedule.is_booked && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(schedule.id)}
                            className="h-8 w-8 text-slate-400 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      
                      {schedule.is_booked ? (
                        <div>
                          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                            Reservado
                          </Badge>
                          {schedule.booked_by_client && (
                            <p className="text-xs text-blue-600 mt-1 truncate">
                              {schedule.booked_by_client}
                            </p>
                          )}
                        </div>
                      ) : schedule.is_blocked ? (
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="bg-slate-200">
                            Bloqueado
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleBlockMutation.mutate({ id: schedule.id, blocked: false })}
                            className="h-7 text-xs"
                          >
                            Desbloquear
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                            Disponível
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleBlockMutation.mutate({ id: schedule.id, blocked: true })}
                            className="h-7 text-xs"
                          >
                            Bloquear
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>

                {getSchedulesForDate(selectedDate).length === 0 && (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-500">Nenhum horário configurado</p>
                    <p className="text-slate-400 text-sm">
                      Adicione horários manualmente ou clique em "Adicionar todos"
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {!selectedDate && (
        <Card className="border-0 shadow-lg">
          <CardContent className="py-12 text-center">
            <Calendar className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Selecione uma data acima</p>
            <p className="text-slate-400 text-sm mt-1">
              Para gerenciar os horários disponíveis
            </p>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span>Disponível</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span>Reservado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-slate-400" />
          <span>Bloqueado</span>
        </div>
      </div>
    </div>
  );
}