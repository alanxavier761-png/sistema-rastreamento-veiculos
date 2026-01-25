import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Star, Car, AlertCircle, Loader2, CheckCircle2, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function Avaliacao() {
  const urlParams = new URLSearchParams(window.location.search);
  const trackingCode = urlParams.get('code');
  const queryClient = useQueryClient();
  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order-avaliation', trackingCode],
    queryFn: async () => {
      const orders = await base44.entities.Order.filter({ tracking_code: trackingCode });
      return orders[0];
    },
    enabled: !!trackingCode
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (rating === 0) {
        throw new Error('Selecione uma avaliação');
      }

      await base44.entities.Order.update(order.id, {
        avaliacao_estrelas: rating,
        avaliacao_comentario: comment || null,
        avaliacao_data: new Date().toISOString(),
        current_status: 'concluido',
        status_publico: 'Concluído'
      });

      await base44.entities.ActionLog.create({
        order_id: order.id,
        tracking_code: order.tracking_code,
        action: `[AVALIAÇÃO] Cliente avaliou com ${rating} estrelas`,
        user_email: order.client_email,
        user_name: order.client_name,
        details: JSON.stringify({ stars: rating, comment })
      });

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['order-avaliation', trackingCode]);
      setSubmitted(true);
      toast.success('Obrigado pela sua avaliação!');
    },
    onError: (err) => {
      toast.error('Erro ao enviar avaliação', { description: err.message });
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-amber-50 to-orange-50">
        <Loader2 className="w-12 h-12 animate-spin text-amber-600" />
      </div>
    );
  }

  if (!trackingCode || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-amber-50 to-orange-50 p-4">
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

  // Já avaliado ou concluído
  if (order.avaliacao_data || order.current_status === 'concluido' || submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="max-w-md mx-auto border-0 shadow-2xl">
            <CardContent className="p-8 text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <CheckCircle2 className="w-20 h-20 text-emerald-600 mx-auto mb-4" />
              </motion.div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                {submitted ? 'Avaliação Enviada!' : 'Já Avaliado'}
              </h2>
              <p className="text-slate-500 mb-4">
                {submitted 
                  ? 'Obrigado pelo seu feedback!' 
                  : 'Você já avaliou este pedido anteriormente.'}
              </p>
              {order.avaliacao_estrelas && (
                <div className="flex justify-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-6 h-6 ${
                        star <= order.avaliacao_estrelas
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  ))}
                </div>
              )}
              <p className="text-slate-400 text-sm">
                Sua opinião é muito importante para nós!
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-orange-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-6xl mb-4"
            >
              ⭐
            </motion.div>
            <h1 className="text-3xl font-bold text-slate-800">
              Avalie sua Experiência
            </h1>
            <p className="text-slate-500 mt-2">
              Sua opinião nos ajuda a melhorar!
            </p>
          </div>

          {/* Vehicle Info */}
          <Card className="border-0 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <Car className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Veículo Entregue</p>
                  <p className="text-xl font-bold text-slate-800">{order.vehicle_model}</p>
                  <p className="text-slate-600">{order.vehicle_color}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rating Form */}
          <Card className="border-0 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-center text-2xl">
                Como foi sua experiência?
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              {/* Stars */}
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isActive = star <= (hoverRating || rating);
                  
                  return (
                    <motion.button
                      key={star}
                      type="button"
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-12 h-12 transition-all ${
                          isActive
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300 hover:text-amber-300'
                        }`}
                      />
                    </motion.button>
                  );
                })}
              </div>

              {/* Rating Text */}
              <AnimatePresence mode="wait">
                {rating > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-center"
                  >
                    <p className="text-2xl font-bold text-amber-600">
                      {rating === 5 && '😍 Excelente!'}
                      {rating === 4 && '😊 Muito Bom!'}
                      {rating === 3 && '🙂 Bom'}
                      {rating === 2 && '😐 Regular'}
                      {rating === 1 && '😞 Insatisfeito'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Comentário (opcional)
                </label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Conte-nos mais sobre sua experiência..."
                  className="min-h-[120px] resize-none"
                />
              </div>

              {/* Submit Button */}
              <Button
                onClick={() => submitMutation.mutate()}
                disabled={rating === 0 || submitMutation.isPending}
                className="w-full h-14 text-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 gap-2"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Enviar Avaliação
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-slate-400">
                Sua avaliação nos ajuda a oferecer um serviço cada vez melhor
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}