import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Car, AlertCircle, Calendar, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StatusTimeline from '@/components/StatusTimeline';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export default function Tracking() {
  const urlParams = new URLSearchParams(window.location.search);
  const trackingCode = urlParams.get('code');
  
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // ========== SINCRONIZAÇÃO EM TEMPO REAL ==========
  useEffect(() => {
    if (!trackingCode) {
      setIsLoading(false);
      return;
    }

    let intervalId = null;

    const loadOrder = async (showLoader = true) => {
      try {
        if (showLoader) setIsLoading(true);
        
        // ✅ CORRIGIDO: Buscar APENAS o pedido específico
        const orders = await base44.entities.Order.filter({ 
          tracking_code: trackingCode 
        });
        const foundOrder = orders[0];
        
        if (foundOrder) {
          // Detectar mudança de status
          if (order && foundOrder.current_status !== order.current_status) {
            // 🔔 NOTIFICAR MUDANÇA
            toast.success('Status Atualizado! 🎉', {
              description: foundOrder.status_publico || foundOrder.current_status,
              duration: 5000,
              className: 'bg-emerald-50 border-emerald-200'
            });
            
            console.log('🔄 Status mudou:', {
              anterior: order.current_status,
              novo: foundOrder.current_status,
              timestamp: new Date().toISOString()
            });
          }
          
          setOrder(foundOrder);
          setLastUpdate(new Date());
          setError(null);
        } else {
          setOrder(null);
          setError('Pedido não encontrado');
        }
      } catch (err) {
        console.error('❌ Erro ao carregar pedido:', err);
        setError(err.message);
      } finally {
        if (showLoader) setIsLoading(false);
      }
    };

    // ⚡ CARREGAR INICIALMENTE
    loadOrder(true);
    
    // ⚡ ATUALIZAR A CADA 5 SEGUNDOS (tempo real)
    intervalId = setInterval(() => {
      loadOrder(false); // Sem loader para não piscar
    }, 5000);
    
    // ⚡ ATUALIZAR QUANDO PÁGINA FICA VISÍVEL
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ Página voltou a ficar visível - atualizando...');
        loadOrder(false);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup
    return () => {
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [trackingCode]); // ✅ CORRIGIDO: Removido order?.current_status para evitar memory leak

  // ========== INDICADOR DE ATUALIZAÇÃO ==========
  const LastUpdateIndicator = () => {
    if (!lastUpdate) return null;
    
    const [seconds, setSeconds] = useState(0);
    
    useEffect(() => {
      const timer = setInterval(() => {
        setSeconds(Math.floor((new Date() - lastUpdate) / 1000));
      }, 1000);
      
      return () => clearInterval(timer);
    }, [lastUpdate]);
    
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center text-xs text-slate-400 mt-2"
      >
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span>
            Atualizado há {seconds}s
          </span>
        </div>
      </motion.div>
    );
  };

  // ========== LOADING ==========
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Car className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
          </motion.div>
          <p className="text-slate-600 font-medium">Carregando seu pedido...</p>
          <p className="text-slate-400 text-sm mt-1">Aguarde um momento</p>
        </div>
      </div>
    );
  }

  // ========== ERRO: CÓDIGO NÃO INFORMADO ==========
  if (!trackingCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="max-w-md mx-auto border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-800 mb-2">
              Código não informado
            </h2>
            <p className="text-slate-500">
              É necessário informar o código de rastreamento na URL
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ========== ERRO: PEDIDO NÃO ENCONTRADO ==========
  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="max-w-md mx-auto border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <Car className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-800 mb-2">
              Pedido não encontrado
            </h2>
            <p className="text-slate-500 mb-1">Código: {trackingCode}</p>
            <p className="text-slate-400 text-sm">
              Verifique se o código está correto
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ========== RENDERIZAR TRACKING ==========
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* ========== HEADER ========== */}
          <div className="text-center mb-8">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-5xl mb-4"
            >
              🚗
            </motion.div>
            <h1 className="text-2xl font-bold text-slate-800">
              Acompanhe seu Veículo
            </h1>
            <p className="text-slate-500 mt-2">
              Rastreamento em tempo real
            </p>
          </div>

          {/* ========== CARD PRINCIPAL ========== */}
          <AnimatePresence mode="wait">
            <motion.div
              key={order.current_status} // Anima quando status muda
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-0 shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6">
                  <p className="text-emerald-100 text-sm font-mono">
                    #{order.tracking_code}
                  </p>
                  <h2 className="text-2xl font-bold mt-1">{order.client_name}</h2>
                </div>
                <CardContent className="p-6">
                  <StatusTimeline 
                    currentStatus={order.current_status}
                    orderType={order.order_type}
                    isPublic={true}
                  />
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* ========== INFORMAÇÕES DO VEÍCULO ========== */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Car className="w-7 h-7 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Seu Veículo</p>
                  <p className="text-xl font-bold text-slate-800">
                    {order.vehicle_model}
                  </p>
                  <p className="text-slate-600">{order.vehicle_color}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ========== DATA DE AGENDAMENTO (se houver) ========== */}
          {order.scheduled_date && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="border-0 shadow-xl bg-gradient-to-r from-emerald-50 to-teal-50">
                  <CardContent className="p-6">
                    <div className="text-center mb-3">
                      <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
                      <h3 className="text-xl font-bold text-emerald-700">
                        Retirada Agendada! 🎉
                      </h3>
                    </div>
                    <div className="flex items-center justify-center gap-4 bg-white rounded-xl p-5">
                      <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center">
                        <Calendar className="w-7 h-7 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 font-medium">
                          Data da Retirada
                        </p>
                        <p className="text-2xl font-bold text-slate-800">
                          {format(new Date(order.scheduled_date), "dd 'de' MMMM", { locale: ptBR })}
                        </p>
                        <p className="text-emerald-600 font-semibold">
                          às {order.scheduled_time}
                        </p>
                      </div>
                    </div>
                    <p className="text-center text-sm text-slate-600 mt-4">
                      Aguardamos você na data marcada! 🚗
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          )}

          {/* ========== INDICADOR DE ATUALIZAÇÃO ========== */}
          <div className="text-center">
            <LastUpdateIndicator />
            <p className="text-slate-400 text-sm mt-2">
              Atualização automática a cada 5 segundos
            </p>
          </div>

          {/* ========== FOOTER ========== */}
          <div className="text-center text-slate-400 text-xs mt-6 pb-4">
            <p>Não é necessário recarregar a página</p>
            <p className="mt-1">O status é atualizado automaticamente</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}