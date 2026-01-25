import React from 'react';
import { CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FLUXO_OFICIAL, isStatusApplicable } from '@/components/workflow/WorkflowEngine';
import { motion } from 'framer-motion';

export default function StatusTimeline({ currentStatus, order, orderType = 'pedido_estoque', paymentMethod, financingType, isPublic = false, compact = false }) {
  // Criar objeto order se não foi passado
  const orderData = order || { 
    order_type: orderType, 
    payment_method: paymentMethod,
    financiamento_tipo: financingType 
  };
  
  // Filtrar etapas baseado no tipo de pedido e forma de pagamento
  let steps = FLUXO_OFICIAL.filter(s => {
    // Esconder cancelado da timeline
    if (s.id === 'cancelado') return false;
    
    // Usar a função isStatusApplicable para verificar se a etapa é aplicável
    if (!isStatusApplicable(orderData, s.id)) {
      return false;
    }
    
    // Esconder financiamento interno se for público (confuso para cliente)
    if (isPublic && s.id === 'financiamento_interno') {
      return false;
    }
    
    return true;
  });
  
  const currentIndex = steps.findIndex(s => s.id === currentStatus);
  const isCancelled = currentStatus === 'cancelado';
  
  if (compact) {
    return (
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {steps.map((step, index) => {
          const isPast = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <React.Fragment key={step.id}>
              <div
                className={cn(
                  "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-base font-semibold transition-all",
                  isPast && "bg-white/30 border-2 border-white/50",
                  isCurrent && "bg-white border-2 border-white scale-110 shadow-lg",
                  !isPast && !isCurrent && "bg-white/10 border-2 border-white/20"
                )}
                title={step.nome}
              >
                {isPast ? (
                  <CheckCircle2 className="w-5 h-5 text-white" />
                ) : (
                  <span className={cn(
                    isCurrent ? "text-blue-600" : "text-white/50"
                  )}>
                    {step.icon}
                  </span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={cn(
                  "w-8 h-0.5 flex-shrink-0 transition-all",
                  index < currentIndex ? "bg-white/50" : "bg-white/20"
                )} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }
  
  return (
    <div className="relative">
      {isCancelled && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700 font-medium">Pedido Cancelado</span>
        </div>
      )}
      
      <div className="space-y-0">
        {steps.map((step, index) => {
          const isPast = index < currentIndex;
          const isCurrent = index === currentIndex && !isCancelled;
          const isFuture = index > currentIndex || isCancelled;
          
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-start gap-4 relative"
            >
              {/* Linha conectora */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "absolute left-5 top-10 w-0.5 h-full -ml-px",
                    isPast ? "bg-emerald-300" : "bg-slate-200"
                  )}
                  style={{ height: 'calc(100% - 10px)' }}
                />
              )}
              
              {/* Ícone */}
              <div className={cn(
                "relative z-10 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                isPast && "bg-emerald-100",
                isCurrent && "bg-blue-100 ring-4 ring-blue-50 shadow-lg shadow-blue-100",
                isFuture && "bg-slate-100"
              )}>
                {isPast && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                {isCurrent && (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Clock className="w-5 h-5 text-blue-600" />
                  </motion.div>
                )}
                {isFuture && <Circle className="w-5 h-5 text-slate-400" />}
              </div>
              
              {/* Conteúdo */}
              <div className="flex-1 pb-8 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{step.icon}</span>
                  <h3 className={cn(
                    "font-semibold transition-colors",
                    isPast && "text-emerald-700",
                    isCurrent && "text-blue-700",
                    isFuture && "text-slate-400"
                  )}>
                    {step.nome}
                  </h3>
                </div>
                
                {isCurrent && !isPublic && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-blue-600 mt-1 font-medium"
                  >
                    ⏳ Etapa atual
                  </motion.p>
                )}
                
                {isPast && (
                  <p className="text-sm text-emerald-600 mt-1">
                    ✓ Concluído
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}