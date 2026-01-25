import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Car, Calendar, Clock, Loader2, CheckCircle2, 
  AlertCircle, ChevronLeft, ChevronRight, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { format, parseISO, addDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import StatusTimeline from '@/components/StatusTimeline';

export default function Pedido() {
  const urlParams = new URLSearchParams(window.location.search);
  const trackingCode = urlParams.get('code');
  const queryClient = useQueryClient();
  
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  const { data: order, isLoading: loadingOrder } = useQuery({
    queryKey: ['order-tracking', trackingCode],
    queryFn: async () => {
      const orders = await base44.entities.Order.filter({ tracking_code: trackingCode });
      return orders[0];
    },
    enabled: !!trackingCode,
    refetchInterval: 5000
  });

  const { data: schedules = [], isLoading: loadingSchedules } = useQuery({
    queryKey: ['available-schedules'],
    queryFn: () => base44.entities.Schedule.list('date'),
    enabled: !!order && order.delivery_scheduling_released && !order.scheduled_date
  });

  const bookMutation = useMutation({
    mutationFn: async ({ scheduleId, date, time }) => {
      // Update schedule
      await base44.entities.Schedule.update(scheduleId, {
        is_booked: true,
        booked_by_order: order.id,
        booked_by_client: order.client_name
      });
      
      // Update order
      await base44.entities.Order.update(order.id, {
        scheduled_date: date,
        scheduled_time: time,
        previous_schedule_id: scheduleId,
        current_status: 'patio',
        status_publico: 'Pátio'
      });
      
      return { date, time };
    },
    onSuccess: ({ date, time }) => {
      queryClient.invalidateQueries(['order-tracking', trackingCode]);
      queryClient.invalidateQueries(['available-schedules']);
      toast.success('Entrega agendada com sucesso!', {
        description: `${format(parseISO(date), "dd 'de' MMMM", { locale: ptBR })} às ${time}`
      });
    },
    onError: (err) => {
      toast.error('Erro ao agendar', { description: err.message });
    }
  });

  if (loadingOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto" />
          <p className="text-slate-600 mt-4">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!trackingCode || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 p-4">
        <Card className="max-w-md mx-auto border-0 shadow-2xl">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              Pedido não encontrado
            </h2>
            <p className="text-slate-500">
              Verifique o código de rastreamento
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get available dates with schedules
  const availableDates = [...new Set(
    schedules
      .filter(s => !s.is_blocked && !s.is_booked)
      .map(s => s.date.split('T')[0])
  )].sort();

  const getTimesForDate = (dateStr) => {
    return schedules
      .filter(s => 
        s.date.split('T')[0] === dateStr && 
        !s.is_blocked && 
        !s.is_booked
      )
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  const selectedSchedule = schedules.find(s => 
    s.date.split('T')[0] === selectedDate && 
    s.time === selectedTime &&
    !s.is_blocked &&
    !s.is_booked
  );

  const handleConfirmBooking = () => {
    if (!selectedSchedule) return;
    
    bookMutation.mutate({
      scheduleId: selectedSchedule.id,
      date: selectedDate,
      time: selectedTime
    });
  };

  const canSchedule = order.delivery_scheduling_released && 
    !order.scheduled_date && 
    order.current_status === 'agendamento';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-6xl mb-4"
          >
            🚗
          </motion.div>
          <h1 className="text-2xl font-bold text-slate-800">
            Meu Pedido
          </h1>
          <p className="text-slate-500 font-mono">#{order.tracking_code}</p>
        </div>

        {/* Order Info */}
        <Card className="border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                <Car className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Seu Veículo</p>
                <p className="text-xl font-bold text-slate-800">{order.vehicle_model}</p>
                <p className="text-slate-600">{order.vehicle_color}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Status do Pedido</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusTimeline currentStatus={order.current_status} isPublic />
          </CardContent>
        </Card>

        {/* Already Scheduled */}
        {order.scheduled_date && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-emerald-50 to-teal-50">
              <CardContent className="p-6 text-center">
                <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-emerald-700 mb-4">
                  Entrega Agendada! 🎉
                </h3>
                <div className="bg-white rounded-2xl p-6 shadow-lg inline-block">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <Calendar className="w-7 h-7 text-emerald-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm text-slate-500">Data da Retirada</p>
                      <p className="text-2xl font-bold text-slate-800">
                        {format(parseISO(order.scheduled_date), "dd 'de' MMMM", { locale: ptBR })}
                      </p>
                      <p className="text-emerald-600 font-semibold flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        às {order.scheduled_time}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Schedule Selection */}
        {canSchedule && (
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                Agendar Retirada
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {loadingSchedules ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
                </div>
              ) : availableDates.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-500">Nenhuma data disponível no momento</p>
                  <p className="text-sm text-slate-400">Aguarde a liberação de novos horários</p>
                </div>
              ) : (
                <>
                  {/* Date Selection */}
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-3">
                      Selecione uma data:
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {availableDates.slice(0, 14).map(dateStr => {
                        const date = parseISO(dateStr);
                        const isSelected = selectedDate === dateStr;
                        const availableTimes = getTimesForDate(dateStr).length;
                        
                        return (
                          <button
                            key={dateStr}
                            onClick={() => {
                              setSelectedDate(dateStr);
                              setSelectedTime(null);
                            }}
                            className={`
                              flex-shrink-0 w-20 p-3 rounded-xl text-center transition-all
                              ${isSelected 
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
                                : 'bg-slate-50 hover:bg-slate-100'}
                            `}
                          >
                            <p className={`text-xs font-medium uppercase ${
                              isSelected ? 'text-emerald-100' : 'text-slate-500'
                            }`}>
                              {format(date, 'EEE', { locale: ptBR })}
                            </p>
                            <p className="text-2xl font-bold">
                              {format(date, 'd')}
                            </p>
                            <p className={`text-xs ${
                              isSelected ? 'text-emerald-100' : 'text-slate-500'
                            }`}>
                              {format(date, 'MMM', { locale: ptBR })}
                            </p>
                            <Badge 
                              variant="secondary" 
                              className={`mt-1 text-xs ${
                                isSelected ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {availableTimes} horários
                            </Badge>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time Selection */}
                  <AnimatePresence mode="wait">
                    {selectedDate && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <p className="text-sm font-medium text-slate-700 mb-3">
                          Selecione um horário:
                        </p>
                        <div className="grid grid-cols-4 gap-2">
                          {getTimesForDate(selectedDate).map(schedule => (
                            <button
                              key={schedule.id}
                              onClick={() => setSelectedTime(schedule.time)}
                              className={`
                                p-3 rounded-lg font-medium transition-all
                                ${selectedTime === schedule.time
                                  ? 'bg-emerald-600 text-white shadow-lg'
                                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700'}
                              `}
                            >
                              {schedule.time}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Confirm Button */}
                  {selectedDate && selectedTime && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="pt-4 border-t"
                    >
                      <div className="bg-emerald-50 rounded-xl p-4 mb-4">
                        <p className="text-sm text-emerald-700">
                          <strong>Resumo:</strong> {format(parseISO(selectedDate), "EEEE, dd 'de' MMMM", { locale: ptBR })} às {selectedTime}
                        </p>
                      </div>
                      <Button
                        onClick={handleConfirmBooking}
                        disabled={bookMutation.isPending}
                        className="w-full h-12 text-lg bg-emerald-600 hover:bg-emerald-700 gap-2"
                      >
                        {bookMutation.isPending ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Agendando...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-5 h-5" />
                            Confirmar Agendamento
                          </>
                        )}
                      </Button>
                    </motion.div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Waiting for Release */}
        {!canSchedule && !order.scheduled_date && (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <Clock className="w-12 h-12 text-amber-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-slate-800">
                Aguardando Liberação
              </h3>
              <p className="text-slate-500 text-sm mt-2">
                O agendamento será liberado em breve. 
                <br />
                Você receberá uma notificação!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}