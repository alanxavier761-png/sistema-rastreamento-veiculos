import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Banknote, Building2, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

const PAYMENT_METHODS = {
  pix: { label: 'PIX', icon: Wallet, color: 'bg-emerald-100 text-emerald-700' },
  boleto: { label: 'Boleto', icon: Banknote, color: 'bg-amber-100 text-amber-700' },
  financiamento: { label: 'Financiamento', icon: Building2, color: 'bg-blue-100 text-blue-700' },
  vista: { label: 'À Vista', icon: CreditCard, color: 'bg-purple-100 text-purple-700' }
};

const PAYMENT_STATUS = {
  aguardando: { label: 'Aguardando', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  pago: { label: 'Pago', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  liberado: { label: 'Liberado', color: 'bg-blue-100 text-blue-700 border-blue-200' }
};

export default function PaymentStatus({ method, status, showMethod = true, showStatus = true }) {
  const methodInfo = PAYMENT_METHODS[method] || PAYMENT_METHODS.pix;
  const statusInfo = PAYMENT_STATUS[status] || PAYMENT_STATUS.aguardando;
  const Icon = methodInfo.icon;
  
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {showMethod && (
        <Badge variant="secondary" className={cn("gap-1", methodInfo.color)}>
          <Icon className="w-3 h-3" />
          {methodInfo.label}
        </Badge>
      )}
      {showStatus && (
        <Badge variant="outline" className={cn("border", statusInfo.color)}>
          {statusInfo.label}
        </Badge>
      )}
    </div>
  );
}