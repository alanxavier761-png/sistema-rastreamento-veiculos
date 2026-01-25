import { base44 } from '@/api/base44Client';

// ✅ CORRIGIDO: URL base para substituir window.location
const BASE_URL = import.meta.env.VITE_APP_URL || 'https://statusmeucarronovotoriba.com.br';

// ========== FLUXO OFICIAL ==========
export const FLUXO_OFICIAL = [
  { id: 'pedido_criado', nome: 'Pedido Criado', icon: '📋' },
  { id: 'financiamento_interno', nome: 'Financiamento em Análise', icon: '🏦' },
  { id: 'fabrica_documentacao', nome: 'Fábrica - Documentação', icon: '📄' },
  { id: 'fabrica_encomendado', nome: 'Fábrica - Encomendado', icon: '🏭' },
  { id: 'fabrica_faturado', nome: 'Fábrica - Faturado', icon: '🚚' },
  { id: 'documentos_cliente', nome: 'Documentação', icon: '📄' },
  { id: 'nota_fiscal', nome: 'Nota Fiscal', icon: '🧾' },
  { id: 'pagamento', nome: 'Pagamento', icon: '💳' },
  { id: 'emplacamento', nome: 'Emplacamento', icon: '🔧' },
  { id: 'agendamento', nome: 'Agendamento', icon: '📅' },
  { id: 'patio', nome: 'Pátio', icon: '🅿️' },
  { id: 'entrega', nome: 'Entrega', icon: '🚗' },
  { id: 'avaliacao', nome: 'Avaliação', icon: '⭐' },
  { id: 'concluido', nome: 'Concluído', icon: '✅' },
  { id: 'cancelado', nome: 'Cancelado', icon: '❌' }
];

export const STATUS_PUBLICO_MAP = Object.fromEntries(
  FLUXO_OFICIAL.map(item => [item.id, item.nome])
);

// ========== VALIDAÇÕES ==========
const VALIDACOES = {
  pedido_criado: () => true,
  
  financiamento_interno: () => true,
  
  fabrica_documentacao: (order) => {
    if (order.order_type !== 'pedido_fabrica') {
      throw new Error('Este status é apenas para pedidos de fábrica');
    }
    
    // Docs cliente
    if (order.client_type === 'pf') {
      if (!order.docs_rg && !order.docs_cnh) throw new Error('Envie RG ou CNH');
      if (!order.docs_cpf || !order.docs_comprovante_residencia) {
        throw new Error('Documentos de pessoa física incompletos');
      }
    } else {
      if (!order.docs_contrato_social || !order.docs_cnpj) {
        throw new Error('Documentos de pessoa jurídica incompletos');
      }
    }
    
    // Docs gerais
    if (!order.docs_coaf_montadora || !order.docs_coaf_toriba || 
        !order.docs_sinal || !order.docs_recibo || !order.docs_vianuvem_criado) {
      throw new Error('Documentos gerais incompletos');
    }
    
    // Docs trade-in (se houver)
    if (order.has_trade_in) {
      if (!order.docs_laudo_cautelar || !order.docs_pesquisa_multas || !order.docs_dut_aptv_separado) {
        throw new Error('Documentos do usado incompletos');
      }
    }
    
    return true;
  },
  
  fabrica_encomendado: (order) => {
    if (order.order_type !== 'pedido_fabrica') {
      throw new Error('Este status é apenas para pedidos de fábrica');
    }
    if (!order.fabrica_data_pedido) {
      throw new Error('Data do pedido na montadora não informada');
    }
    return true;
  },
  
  fabrica_faturado: (order) => {
    if (order.order_type !== 'pedido_fabrica') {
      throw new Error('Este status é apenas para pedidos de fábrica');
    }
    if (!order.fabrica_nf_montadora || !order.fabrica_data_faturamento) {
      throw new Error('Dados de faturamento da montadora incompletos');
    }
    return true;
  },
  
  documentos_cliente: (order) => {
    // Docs cliente
    if (order.client_type === 'pf') {
      if (!order.docs_rg && !order.docs_cnh) throw new Error('Envie RG ou CNH');
      if (!order.docs_cpf || !order.docs_comprovante_residencia) {
        throw new Error('Documentos de pessoa física incompletos');
      }
    } else {
      if (!order.docs_contrato_social || !order.docs_cnpj) {
        throw new Error('Documentos de pessoa jurídica incompletos');
      }
    }
    
    // Docs gerais
    if (!order.docs_coaf_montadora || !order.docs_coaf_toriba || 
        !order.docs_sinal || !order.docs_recibo || !order.docs_vianuvem_criado) {
      throw new Error('Documentos gerais incompletos');
    }
    
    // Docs trade-in (se houver)
    if (order.has_trade_in) {
      if (!order.docs_laudo_cautelar || !order.docs_pesquisa_multas || !order.docs_dut_aptv_separado) {
        throw new Error('Documentos do usado incompletos');
      }
    }
    
    return true;
  },
  
  nota_fiscal: (order) => {
    if (!order.nf_emitida) {
      throw new Error('Nota fiscal não foi emitida');
    }
    if (!order.nf_numero || !order.nf_chave_acesso || !order.nf_data_emissao) {
      throw new Error('Dados da nota fiscal incompletos');
    }
    return true;
  },
  
  pagamento: (order) => {
    const isPaid = order.payment_status === 'pago' || order.payment_status === 'liberado';
    if (!isPaid) {
      throw new Error('Pagamento ainda não foi confirmado');
    }
    
    if (order.payment_method === 'pix' && !order.comprovante_banco_recebido) {
      throw new Error('Comprovante de pagamento PIX não foi recebido');
    }
    
    if (order.payment_method === 'financiamento' && !order.financiamento_pago) {
      throw new Error('Pagamento do financiamento não foi confirmado');
    }
    
    if (order.has_entrada && !order.entrada_recebida) {
      throw new Error('Entrada não foi recebida');
    }
    
    if (!order.pagamento_total_confirmado) {
      throw new Error('Pagamento total ainda não foi confirmado pelo setor financeiro');
    }
    
    return true;
  },
  
  emplacamento: (order) => {
    if (!order.emplacamento_concluido) {
      throw new Error('Emplacamento ainda não foi concluído');
    }
    if (!order.vehicle_plate) {
      throw new Error('Placa do veículo não foi informada');
    }
    // ✅ CORRIGIDO: Excluir I, O, Q conforme regras Mercosul
    const plateRegex = /^[A-HJ-NPR-Z]{3}\d{4}$|^[A-HJ-NPR-Z]{3}\d[A-HJ-NPR-Z]\d{2}$/;
    if (!plateRegex.test(order.vehicle_plate?.toUpperCase())) {
      throw new Error('Formato de placa inválido. Use ABC1234 ou ABC1D23');
    }
    return true;
  },
  
  agendamento: (order) => {
    if (!order.scheduled_date || !order.scheduled_time) {
      throw new Error('Entrega ainda não foi agendada');
    }
    const scheduledDate = new Date(order.scheduled_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (scheduledDate < today) {
      throw new Error('Data agendada está no passado. É necessário reagendar.');
    }
    return true;
  },
  
  patio: (order) => {
    if (!order.scheduled_date) {
      throw new Error('Não há data de entrega agendada');
    }
    return true;
  },
  
  entrega: (order) => {
    if (!order.entrega_confirmada) {
      throw new Error('Entrega ainda não foi confirmada');
    }
    return true;
  },
  
  avaliacao: () => true,
  concluido: () => false,
  cancelado: () => false
};

// ========== AVANÇAR STATUS ==========
export async function advanceOrderStatus(order, targetStatus, user = null) {
  console.log('🎯 [WorkflowEngine] Avançando:', {
    orderId: order.id,
    from: order.current_status,
    to: targetStatus
  });

  try {
    // Verifica se a etapa é aplicável
    if (!isStatusApplicable(order, targetStatus)) {
      const erro = 'Esta etapa não se aplica a este tipo de pedido';
      console.error('❌ Etapa não aplicável:', erro);
      throw new Error(erro);
    }
    
    // Verifica se a etapa existe
    if (!VALIDACOES[targetStatus]) {
      const erro = `Status inválido: ${targetStatus}`;
      console.error('❌ Status inválido:', erro);
      throw new Error(erro);
    }

    // Valida requisitos
    console.log('🔍 Validando requisitos para:', targetStatus);
    console.log('📦 Order data:', order);
    VALIDACOES[targetStatus](order);
    console.log('✅ Validação passou!');

    // Atualiza o pedido
    const updateData = {
      current_status: targetStatus,
      status_publico: STATUS_PUBLICO_MAP[targetStatus],
      last_updated_at: new Date().toISOString(),
      last_updated_by: user?.email || 'system',
      status_history: [
        ...(order.status_history || []),
        {
          status: targetStatus,
          timestamp: new Date().toISOString(),
          user: user?.email || 'system',
          from: order.current_status
        }
      ]
    };

    // Prazo de avaliação
    if (targetStatus === 'avaliacao') {
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() + 7);
      updateData.avaliacao_prazo_limite = limitDate.toISOString();
    }

    const updatedOrder = await base44.entities.Order.update(order.id, updateData);

    // Log da ação
    await base44.entities.ActionLog.create({
      order_id: order.id,
      tracking_code: order.tracking_code,
      action: `Avanço: ${order.current_status} → ${targetStatus}`,
      user_email: user?.email || 'system',
      user_name: user?.full_name || 'Sistema',
      details: JSON.stringify({ old_status: order.current_status, new_status: targetStatus })
    });

    // Notificação (com proteção)
    try {
      await sendStatusChangeNotification(updatedOrder, targetStatus);
    } catch (err) {
      console.error('⚠️ Erro ao enviar notificação (não crítico):', err);
      // Continua mesmo se email falhar
    }

    console.log('✅ [WorkflowEngine] Avanço concluído');
    return updatedOrder;

  } catch (error) {
    console.error('❌ [WorkflowEngine] Erro:', error.message);
    throw error;
  }
}

// ========== CANCELAR PEDIDO ==========
export async function cancelOrder(order, reason, user = null) {
  console.log('🚫 [WorkflowEngine] Cancelando pedido:', order.id);

  try {
    const updateData = {
      current_status: 'cancelado',
      status_publico: 'Cancelado',
      cancelled_at: new Date().toISOString(),
      cancelled_by: user?.email || 'system',
      cancel_reason: reason,
      last_updated_at: new Date().toISOString(),
      last_updated_by: user?.email || 'system',
      status_history: [
        ...(order.status_history || []),
        {
          status: 'cancelado',
          timestamp: new Date().toISOString(),
          user: user?.email || 'system',
          from: order.current_status,
          reason: reason
        }
      ]
    };

    const updatedOrder = await base44.entities.Order.update(order.id, updateData);

    // Libera agendamento se houver
    if (order.previous_schedule_id) {
      try {
        await base44.entities.Schedule.update(order.previous_schedule_id, {
          is_booked: false,
          booked_by_order: null,
          booked_by_client: null
        });
      } catch (err) {
        console.warn('Erro ao liberar horário:', err);
      }
    }

    await base44.entities.ActionLog.create({
      order_id: order.id,
      tracking_code: order.tracking_code,
      action: 'Pedido cancelado',
      user_email: user?.email || 'system',
      user_name: user?.full_name || 'Sistema',
      details: JSON.stringify({ reason })
    });

    await sendCancellationNotification(updatedOrder, reason);

    return updatedOrder;
  } catch (error) {
    console.error('❌ Erro ao cancelar:', error);
    throw error;
  }
}

// ========== PRÓXIMO STATUS PARA AUTO-AVANÇO ==========
export function getNextStatusForAutoAdvance(order) {
  const currentStatus = order.current_status;
  
  const autoAdvanceRules = {
    pedido_criado: () => {
      if (order.order_type === 'pedido_fabrica') return 'fabrica_documentacao';
      if (order.payment_method === 'financiamento' && order.financiamento_tipo === 'interno') {
        return 'financiamento_interno';
      }
      return 'documentos_cliente';
    },
    
    financiamento_interno: () => {
      if (order.financiamento_status === 'aprovado') return 'documentos_cliente';
      return null;
    },
    
    fabrica_documentacao: () => {
      try {
        VALIDACOES.fabrica_documentacao(order);
        return 'fabrica_encomendado';
      } catch {
        return null;
      }
    },
    
    fabrica_encomendado: () => null,
    
    fabrica_faturado: () => 'pagamento',
    
    documentos_cliente: () => {
      try {
        VALIDACOES.documentos_cliente(order);
        return 'nota_fiscal';
      } catch {
        return null;
      }
    },
    
    nota_fiscal: () => {
      try {
        VALIDACOES.nota_fiscal(order);
        return 'pagamento';
      } catch {
        return null;
      }
    },
    
    pagamento: () => {
      try {
        VALIDACOES.pagamento(order);
        return 'emplacamento';
      } catch {
        return null;
      }
    },
    
    emplacamento: () => {
      try {
        VALIDACOES.emplacamento(order);
        return 'agendamento';
      } catch {
        return null;
      }
    },
    
    agendamento: () => {
      try {
        VALIDACOES.agendamento(order);
        return 'patio';
      } catch {
        return null;
      }
    },
    
    patio: () => null,
    
    entrega: () => {
      try {
        VALIDACOES.entrega(order);
        return 'avaliacao';
      } catch {
        return null;
      }
    },
    
    avaliacao: () => {
      if (order.avaliacao_data) return 'concluido';
      if (order.avaliacao_prazo_limite) {
        const prazo = new Date(order.avaliacao_prazo_limite);
        const now = new Date();
        if (now > prazo) return 'concluido';
      }
      return null;
    },
    
    concluido: () => null,
    cancelado: () => null
  };
  
  const rule = autoAdvanceRules[currentStatus];
  return rule ? rule() : null;
}

// ========== VERIFICAR SE STATUS É APLICÁVEL ==========
export function isStatusApplicable(order, status) {
  if (status === 'financiamento_interno') {
    return order.payment_method === 'financiamento' && order.financiamento_tipo === 'interno';
  }
  
  if (status.startsWith('fabrica_')) {
    return order.order_type === 'pedido_fabrica';
  }
  
  if (status === 'documentos_cliente') {
    return order.order_type !== 'pedido_fabrica';
  }
  
  return true;
}

// ========== OBTER PRÓXIMA ETAPA APLICÁVEL ==========
export function getNextApplicableStatus(order, currentStatus) {
  const currentIndex = FLUXO_OFICIAL.findIndex(s => s.id === currentStatus);
  
  for (let i = currentIndex + 1; i < FLUXO_OFICIAL.length; i++) {
    const status = FLUXO_OFICIAL[i];
    if (isStatusApplicable(order, status.id)) {
      return status;
    }
  }
  
  return null;
}

// ========== NOTIFICAÇÕES ==========
async function sendStatusChangeNotification(order, newStatus) {
  try {
    const notifications = {
      pedido_criado: {
        subject: '✅ Pedido Confirmado',
        body: `Olá ${order.client_name},\n\nSeu pedido foi confirmado!\n\nVeículo: ${order.vehicle_model}\nCódigo: ${order.tracking_code}\n\nAcompanhe: ${BASE_URL}/tracking?code=${order.tracking_code}`
      },
      nota_fiscal: {
        subject: '📄 Nota Fiscal Emitida',
        body: `Olá ${order.client_name},\n\nA nota fiscal foi emitida!\n\nNúmero: ${order.nf_numero}\nChave: ${order.nf_chave_acesso}`
      },
      pagamento: {
        subject: '✅ Pagamento Confirmado',
        body: `Olá ${order.client_name},\n\nSeu pagamento foi confirmado!\n\nAcompanhe: ${BASE_URL}/tracking?code=${order.tracking_code}`
      },
      agendamento: {
        subject: '🎉 Veículo Pronto!',
        body: `Olá ${order.client_name},\n\nSeu ${order.vehicle_model} está pronto!\n\nAgende: ${BASE_URL}/pedido?code=${order.tracking_code}`
      },
      patio: {
        subject: '📅 Entrega Agendada',
        body: `Olá ${order.client_name},\n\nSua entrega foi agendada!\n\nData: ${order.scheduled_date}\nHorário: ${order.scheduled_time}`
      },
      entrega: {
        subject: '🚗 Entrega Realizada',
        body: `Olá ${order.client_name},\n\nParabéns! Seu veículo foi entregue!\n\nAvalie: ${BASE_URL}/avaliacao?code=${order.tracking_code}`
      }
    };

    const notification = notifications[newStatus];
    if (notification && order.client_email) {
      await base44.integrations.Core.SendEmail({
        to: order.client_email,
        subject: notification.subject,
        body: notification.body
      });
    }
  } catch (error) {
    console.warn('Erro ao enviar email:', error);
  }
}

async function sendCancellationNotification(order, reason) {
  try {
    if (order.client_email) {
      await base44.integrations.Core.SendEmail({
        to: order.client_email,
        subject: '❌ Pedido Cancelado',
        body: `Olá ${order.client_name},\n\nSeu pedido foi cancelado.\n\nMotivo: ${reason}\nCódigo: ${order.tracking_code}`
      });
    }
  } catch (error) {
    console.warn('Erro ao enviar email de cancelamento:', error);
  }
}

// ========== GERAR CÓDIGO ==========
export function generateTrackingCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'VEH-';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default {
  advanceOrderStatus,
  getNextStatusForAutoAdvance,
  getNextApplicableStatus,
  isStatusApplicable,
  cancelOrder,
  generateTrackingCode,
  FLUXO_OFICIAL,
  STATUS_PUBLICO_MAP,
  VALIDACOES
};