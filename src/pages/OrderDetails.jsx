import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Car, User, CreditCard, ArrowLeft, FileText, CheckCircle,
  Loader2, Copy, ExternalLink, AlertCircle, ChevronRight, Ban, Factory, Truck, Building2, Circle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import StatusTimeline from '@/components/StatusTimeline';
import { 
  advanceOrderStatus, 
  getNextApplicableStatus,
  cancelOrder,
  STATUS_PUBLICO_MAP 
} from '@/components/workflow/WorkflowEngine';

export default function OrderDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('id');
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const orders = await base44.entities.Order.filter({ id: orderId });
      return orders[0];
    },
    enabled: !!orderId,
    refetchInterval: 5000
  });

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const updated = await base44.entities.Order.update(orderId, {
        ...data,
        last_updated_at: new Date().toISOString(),
        last_updated_by: user?.email || 'admin'
      });

      await base44.entities.ActionLog.create({
        order_id: orderId,
        tracking_code: order.tracking_code,
        action: `Pedido atualizado`,
        user_email: user?.email || 'admin',
        user_name: user?.full_name || 'Administrador',
        details: JSON.stringify(data)
      });

      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['order', orderId]);
      toast.success('Atualizado');
    },
    onError: (err) => {
      toast.error('Erro ao atualizar', { description: err.message });
    }
  });

  const advanceMutation = useMutation({
    mutationFn: async (targetStatus) => {
      console.log('🚀 Tentando avançar para:', targetStatus);
      console.log('📦 Order atual:', order);
      return await advanceOrderStatus(order, targetStatus, user);
    },
    onSuccess: (_, targetStatus) => {
      queryClient.invalidateQueries(['order', orderId]);
      toast.success(`✅ Avançado para: ${STATUS_PUBLICO_MAP[targetStatus]}`);
    },
    onError: (err) => {
      console.error('❌ Erro ao avançar:', err);
      toast.error('❌ Erro ao avançar', { 
        description: err.message,
        duration: 5000
      });
    }
  });

  const cancelMutation = useMutation({
    mutationFn: async (reason) => {
      return await cancelOrder(order, reason, user);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['order', orderId]);
      toast.success('Pedido cancelado');
    }
  });

  const copyTrackingLink = () => {
    const link = `${window.location.origin}${createPageUrl('Tracking')}?code=${order.tracking_code}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copiado');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
        <AlertCircle className="w-16 h-16 text-slate-300" />
        <p className="text-slate-500">Pedido não encontrado</p>
        <Link to={createPageUrl('Dashboard')}>
          <Button variant="outline">Voltar ao Dashboard</Button>
        </Link>
      </div>
    );
  }

  const nextStatus = getNextApplicableStatus(order, order.current_status);

  // Mapear status para fases
  const getCurrentPhase = () => {
    const status = order.current_status;
    if (['pedido_criado', 'financiamento_interno', 'fabrica_documentacao', 'fabrica_encomendado', 'fabrica_faturado', 'documentos_cliente'].includes(status)) {
      return 'documentacao';
    }
    if (status === 'nota_fiscal') {
      return 'nota_fiscal';
    }
    if (status === 'pagamento') {
      return 'pagamento';
    }
    if (status === 'emplacamento') {
      return 'emplacamento';
    }
    if (['agendamento', 'patio'].includes(status)) {
      return 'patio';
    }
    if (['entrega', 'avaliacao', 'concluido'].includes(status)) {
      return 'entrega';
    }
    return 'documentacao';
  };

  const currentPhase = getCurrentPhase();

  const PhaseCard = ({ phase, icon: Icon, title, children, isActive, isCompleted }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${isActive ? '' : isCompleted ? 'opacity-50' : 'opacity-30'}`}
    >
      {/* Header da Fase - Estilo Vianuvem */}
      <div className={`rounded-xl overflow-hidden ${isActive ? 'shadow-lg' : 'shadow-sm'}`}>
        <div className={`px-6 py-4 ${isActive ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500' : isCompleted ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-slate-300'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isActive || isCompleted ? 'bg-white/20' : 'bg-white/30'}`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">{title}</h2>
              <p className="text-white/90 text-sm mt-0.5">
                {isCompleted ? '✓ Concluído' : isActive ? '● Em andamento' : '○ Aguardando'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Conteúdo expandido apenas se ativo */}
        {isActive && (
          <div className="bg-white p-6 border-x border-b border-slate-200 rounded-b-xl">
            {children}
          </div>
        )}
      </div>
    </motion.div>
  );

  const CheckItem = ({ label, field, checked }) => (
    <div className="flex items-center gap-3 p-2.5 rounded-md hover:bg-blue-50 transition-colors">
      <Checkbox
        checked={checked || order[field] || false}
        onCheckedChange={(val) => updateMutation.mutate({ [field]: val })}
        className="border-slate-300"
      />
      <Label className="cursor-pointer flex-1 text-slate-700 text-sm">{label}</Label>
    </div>
  );

  const docsClientePF = [
    { label: 'RG ou CNH', field: 'docs_rg', checked: order.docs_rg || order.docs_cnh },
    { label: 'CPF', field: 'docs_cpf' },
    { label: 'Comprovante de Residência', field: 'docs_comprovante_residencia' }
  ];

  const docsClientePJ = [
    { label: 'Contrato Social', field: 'docs_contrato_social' },
    { label: 'CNPJ', field: 'docs_cnpj' }
  ];

  const docsGerais = [
    { label: 'COAF Montadora', field: 'docs_coaf_montadora' },
    { label: 'COAF Toriba', field: 'docs_coaf_toriba' },
    { label: 'Sinal', field: 'docs_sinal' },
    { label: 'Recibo', field: 'docs_recibo' },
    { label: 'Vianuvem Criado', field: 'docs_vianuvem_criado' }
  ];

  const docsUsado = [
    { label: 'Laudo Cautelar', field: 'docs_laudo_cautelar' },
    { label: 'Pesquisa de Multas', field: 'docs_pesquisa_multas' },
    { label: 'DUT ou APTV Separado', field: 'docs_dut_aptv_separado' }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header - Estilo Vianuvem */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-6">
            <Link to={createPageUrl('Dashboard')}>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 gap-2">
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
            </Link>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={copyTrackingLink} 
                className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 gap-2"
              >
                <Copy className="w-4 h-4" />
                Link
              </Button>
              <Link to={`${createPageUrl('Tracking')}?code=${order.tracking_code}`} target="_blank">
                <Button variant="outline" size="sm" className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Tracking
                </Button>
              </Link>
              {order.current_status !== 'cancelado' && order.current_status !== 'concluido' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-red-600 border-red-500 text-white hover:bg-red-700 gap-2"
                  onClick={() => {
                    const reason = prompt('Motivo do cancelamento:');
                    if (reason) cancelMutation.mutate(reason);
                  }}
                >
                  <Ban className="w-4 h-4" />
                  Cancelar
                </Button>
              )}
            </div>
          </div>
          
          <div className="mb-6">
            <p className="text-white/50 text-xs mb-1 uppercase tracking-wide">Pedido #{order.tracking_code}</p>
            <h1 className="text-3xl font-bold mb-2">{order.client_name}</h1>
            <p className="text-white/80 text-lg">{order.vehicle_model} • {order.vehicle_color}</p>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
            <StatusTimeline currentStatus={order.current_status} order={order} compact={true} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Informações Básicas - Estilo Vianuvem */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-700">
                <User className="w-4 h-4" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-slate-500 uppercase font-medium">Nome</Label>
                <p className="font-semibold text-slate-900">{order.client_name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-500 uppercase font-medium">Telefone</Label>
                  <p className="text-slate-900">{order.client_phone}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500 uppercase font-medium">Email</Label>
                  <p className="text-slate-900 text-sm truncate">{order.client_email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-700">
                <Car className="w-4 h-4" />
                Veículo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-slate-500 uppercase font-medium">Modelo</Label>
                <p className="font-semibold text-slate-900">{order.vehicle_model}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-500 uppercase font-medium">Cor</Label>
                  <p className="text-slate-900">{order.vehicle_color}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500 uppercase font-medium">Placa</Label>
                  <p className="text-slate-900 font-mono">{order.vehicle_plate || '—'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FASE 1: DOCUMENTAÇÃO */}
        <PhaseCard
          phase="documentacao"
          icon={FileText}
          title="FASE 1 — Documentação"
          isActive={currentPhase === 'documentacao'}
          isCompleted={['nota_fiscal', 'pagamento', 'emplacamento', 'patio', 'entrega'].includes(currentPhase)}
        >
          <div className="space-y-6">
            <p className="text-slate-600 text-sm leading-relaxed">
              Finalize a documentação para avançar no processo.
            </p>
            
            <div>
              <h3 className="font-semibold mb-3 text-slate-800 text-sm">Documentos do Cliente</h3>
              {(order.client_type === 'pf' ? docsClientePF : docsClientePJ).map((doc, i) => (
                <CheckItem key={i} {...doc} />
              ))}
            </div>

            <div>
              <h3 className="font-semibold mb-3 text-slate-800 text-sm">Documentos Gerais</h3>
              {docsGerais.map((doc, i) => (
                <CheckItem key={i} {...doc} />
              ))}
            </div>

            {order.has_trade_in && (
              <div>
                <h3 className="font-semibold mb-3 text-amber-700 text-sm">Documentos do Usado</h3>
                {docsUsado.map((doc, i) => (
                  <CheckItem key={i} {...doc} />
                ))}
              </div>
            )}

            {nextStatus && (
              <Button
                onClick={() => advanceMutation.mutate(nextStatus.id)}
                disabled={advanceMutation.isPending}
                size="lg"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md text-base h-12 mt-8 rounded-lg"
              >
                {advanceMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <ChevronRight className="w-5 h-5 mr-2" />
                )}
                Confirmar e Avançar
              </Button>
            )}
          </div>
        </PhaseCard>

        {/* FASE 2: NOTA FISCAL */}
        <PhaseCard
          phase="nota_fiscal"
          icon={FileText}
          title="FASE 2 — Nota Fiscal"
          isActive={currentPhase === 'nota_fiscal'}
          isCompleted={['pagamento', 'emplacamento', 'patio', 'entrega'].includes(currentPhase)}
        >
          <div className="space-y-6">
            <p className="text-slate-600">Emita a nota fiscal para prosseguir.</p>
            
            <CheckItem label="Nota Fiscal Emitida" field="nf_emitida" />
            
            {order.nf_emitida && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Número da NF</Label>
                  <Input
                    value={order.nf_numero || ''}
                    onChange={(e) => updateMutation.mutate({ nf_numero: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Chave de Acesso</Label>
                  <Input
                    value={order.nf_chave_acesso || ''}
                    onChange={(e) => updateMutation.mutate({ nf_chave_acesso: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Data de Emissão</Label>
                  <Input
                    type="date"
                    value={order.nf_data_emissao?.split('T')[0] || ''}
                    onChange={(e) => updateMutation.mutate({ nf_data_emissao: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            {nextStatus && (
              <Button
                onClick={() => advanceMutation.mutate(nextStatus.id)}
                disabled={advanceMutation.isPending}
                size="lg"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md text-base h-12 mt-8 rounded-lg"
              >
                {advanceMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <ChevronRight className="w-5 h-5 mr-2" />
                )}
                Confirmar e Avançar
              </Button>
            )}
          </div>
        </PhaseCard>

        {/* FASE 3: PAGAMENTO */}
        <PhaseCard
          phase="pagamento"
          icon={CreditCard}
          title="FASE 3 — Confirmação de Pagamento"
          isActive={currentPhase === 'pagamento'}
          isCompleted={['emplacamento', 'patio', 'entrega'].includes(currentPhase)}
        >
          <div className="space-y-6">
            <p className="text-slate-600">Confirme o pagamento para seguir com o processo.</p>
            
            <div>
              <Label>Status do Pagamento</Label>
              <Select
                value={order.payment_status || 'aguardando'}
                onValueChange={(v) => updateMutation.mutate({ payment_status: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aguardando">Aguardando</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="liberado">Liberado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <CheckItem label="Comprovante Bancário Recebido" field="comprovante_banco_recebido" />
            <CheckItem label="Pagamento Total Confirmado" field="pagamento_total_confirmado" />

            {order.payment_method === 'financiamento' && (
              <div>
                <Label>Status do Financiamento</Label>
                <Select
                  value={order.financiamento_status || 'pendente'}
                  onValueChange={(v) => updateMutation.mutate({ financiamento_status: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="em_analise">Em Análise</SelectItem>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="recusado">Recusado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {nextStatus && (
              <Button
                onClick={() => advanceMutation.mutate(nextStatus.id)}
                disabled={advanceMutation.isPending}
                size="lg"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md text-base h-12 mt-8 rounded-lg"
              >
                {advanceMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <ChevronRight className="w-5 h-5 mr-2" />
                )}
                Confirmar e Avançar
              </Button>
            )}
          </div>
        </PhaseCard>

        {/* FASE 4: EMPLACAMENTO */}
        <PhaseCard
          phase="emplacamento"
          icon={Truck}
          title="FASE 4 — Emplacamento"
          isActive={currentPhase === 'emplacamento'}
          isCompleted={['patio', 'entrega'].includes(currentPhase)}
        >
          <div className="space-y-6">
            <p className="text-slate-600">Preencha os dados para emplacamento do veículo.</p>
            
            <CheckItem label="Emplacamento Concluído" field="emplacamento_concluido" />
            
            <div>
              <Label>Placa do Veículo</Label>
              <Input
                value={order.vehicle_plate || ''}
                onChange={(e) => updateMutation.mutate({ vehicle_plate: e.target.value.toUpperCase() })}
                placeholder="ABC1D23"
                className="mt-1 font-mono"
              />
            </div>

            <Button variant="outline" className="w-full">
              Gerar PDF de Emplacamento
            </Button>

            {nextStatus && (
              <Button
                onClick={() => advanceMutation.mutate(nextStatus.id)}
                disabled={advanceMutation.isPending}
                size="lg"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg text-lg h-14 mt-6"
              >
                {advanceMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <ChevronRight className="w-5 h-5 mr-2" />
                )}
                Confirmar e Avançar
              </Button>
            )}
          </div>
        </PhaseCard>

        {/* FASE 5: PÁTIO */}
        <PhaseCard
          phase="patio"
          icon={Building2}
          title="FASE 5 — Pátio"
          isActive={currentPhase === 'patio'}
          isCompleted={currentPhase === 'entrega'}
        >
          <div className="space-y-6">
            <p className="text-slate-600 mb-4">Veículo já solicitado ao pátio?</p>
            
            <CheckItem label="Veículo Solicitado ao Pátio" field="delivery_scheduling_released" />

            {order.scheduled_date && (
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <Label className="text-xs text-emerald-700 uppercase">Agendado para</Label>
                <p className="text-xl font-bold text-emerald-700">
                  {format(new Date(order.scheduled_date), "dd/MM/yyyy")} às {order.scheduled_time}
                </p>
              </div>
            )}

            {nextStatus && (
              <Button
                onClick={() => advanceMutation.mutate(nextStatus.id)}
                disabled={advanceMutation.isPending}
                size="lg"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md text-base h-12 mt-8 rounded-lg"
              >
                {advanceMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <ChevronRight className="w-5 h-5 mr-2" />
                )}
                Confirmar e Avançar
              </Button>
            )}
          </div>
        </PhaseCard>

        {/* FASE 6: ENTREGA */}
        <PhaseCard
          phase="entrega"
          icon={CheckCircle}
          title="FASE 6 — Entrega"
          isActive={currentPhase === 'entrega'}
          isCompleted={order.current_status === 'concluido'}
        >
          <div className="space-y-6">
            <p className="text-slate-600">Finalize a entrega do veículo ao cliente.</p>
            
            <CheckItem label="Documento Assinado" field="entrega_confirmada" />
            <CheckItem label="Chave Reserva Entregue" field="chave_reserva_entregue" />
            <CheckItem label="Manual do Proprietário" field="manual_entregue" />
            
            <div>
              <Label>Data da Entrega</Label>
              <Input
                type="date"
                value={order.delivery_date?.split('T')[0] || ''}
                onChange={(e) => updateMutation.mutate({ delivery_date: e.target.value })}
                className="mt-1"
              />
            </div>

            {nextStatus && (
              <Button
                onClick={() => advanceMutation.mutate(nextStatus.id)}
                disabled={advanceMutation.isPending}
                size="lg"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg text-lg h-14 mt-6"
              >
                {advanceMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <ChevronRight className="w-5 h-5 mr-2" />
                )}
                Confirmar e Avançar
              </Button>
            )}
          </div>
        </PhaseCard>
      </div>
    </div>
  );
}