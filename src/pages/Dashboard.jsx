import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Car, Package, Clock, CheckCircle, Plus, 
  TrendingUp, Calendar, ArrowRight, Search,
  Filter, FileText, AlertTriangle, Award
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import StatusTimeline from '@/components/StatusTimeline';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [quickFilter, setQuickFilter] = React.useState('all');
  
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-created_date'),
    refetchInterval: 10000
  });

  const stats = {
    total: orders.length,
    emAndamento: orders.filter(o => 
      !['concluido', 'cancelado', 'avaliacao'].includes(o.current_status)
    ).length,
    aguardandoDocumentacao: orders.filter(o => 
      ['documentos_cliente', 'fabrica_documentacao'].includes(o.current_status)
    ).length,
    aguardandoAprovacao: orders.filter(o => 
      o.trade_in_requires_manager_approval && !o.trade_in_manager_approved
    ).length,
    aguardandoAgendamento: orders.filter(o => 
      o.current_status === 'agendamento' && !o.scheduled_date
    ).length,
    concluidos: orders.filter(o => 
      o.current_status === 'concluido'
    ).length,
    cancelados: orders.filter(o => 
      o.current_status === 'cancelado'
    ).length,
    entregasHoje: orders.filter(o => {
      if (!o.scheduled_date) return false;
      const today = new Date().toISOString().split('T')[0];
      return o.scheduled_date.split('T')[0] === today;
    }).length
  };

  const filteredOrders = orders.filter(order => {
    // Filtro de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        order.client_name?.toLowerCase().includes(term) ||
        order.tracking_code?.toLowerCase().includes(term) ||
        order.vehicle_model?.toLowerCase().includes(term) ||
        order.client_email?.toLowerCase().includes(term);
      if (!matchesSearch) return false;
    }
    
    // Filtro por status
    if (statusFilter !== 'all' && order.current_status !== statusFilter) {
      return false;
    }
    
    // Filtros rápidos
    if (quickFilter === 'docs') {
      return ['documentos_cliente', 'fabrica_documentacao'].includes(order.current_status);
    }
    if (quickFilter === 'aprovacao') {
      return order.trade_in_requires_manager_approval && !order.trade_in_manager_approved;
    }
    if (quickFilter === 'agendamento') {
      return order.current_status === 'agendamento' && !order.scheduled_date;
    }
    if (quickFilter === 'hoje') {
      if (!order.scheduled_date) return false;
      const today = new Date().toISOString().split('T')[0];
      return order.scheduled_date.split('T')[0] === today;
    }
    if (quickFilter === 'concluidos') {
      return order.current_status === 'concluido';
    }
    if (quickFilter === 'atrasados') {
      if (!order.scheduled_date || order.current_status === 'concluido') return false;
      const scheduled = new Date(order.scheduled_date);
      const today = new Date();
      return scheduled < today;
    }
    
    return true;
  });

  const recentOrders = filteredOrders;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Car className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
          </motion.div>
          <p className="text-slate-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, color, subtitle, delay }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
        <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-10 ${color}`} />
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">
            {title}
          </CardTitle>
          <div className={`p-2 rounded-lg ${color} bg-opacity-20`}>
            <Icon className={`w-4 h-4 ${color.replace('bg-', 'text-')}`} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-800">{value}</div>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-[1400px] mx-auto">
        {/* Status Badges Bar */}
        <div className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3 overflow-x-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setQuickFilter(quickFilter === 'docs' ? 'all' : 'docs')}
              className={`flex-shrink-0 gap-2 rounded-full h-9 px-4 shadow-sm ${quickFilter === 'docs' ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}
            >
              <span className="text-base">📄</span>
              <span className="w-5 h-5 rounded-full bg-white/90 text-amber-700 text-xs flex items-center justify-center font-bold">{stats.aguardandoDocumentacao}</span>
              <span className="text-sm font-semibold">Docs pendentes</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setQuickFilter(quickFilter === 'aprovacao' ? 'all' : 'aprovacao')}
              className={`flex-shrink-0 gap-2 rounded-full h-9 px-4 shadow-sm ${quickFilter === 'aprovacao' ? 'bg-pink-500 text-white hover:bg-pink-600' : 'bg-pink-100 text-pink-700 hover:bg-pink-200'}`}
            >
              <span className="text-base">👀</span>
              <span className="w-5 h-5 rounded-full bg-white/90 text-pink-700 text-xs flex items-center justify-center font-bold">{stats.aguardandoAprovacao}</span>
              <span className="text-sm font-semibold">Processos que acompanho</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setQuickFilter(quickFilter === 'agendamento' ? 'all' : 'agendamento')}
              className={`flex-shrink-0 gap-2 rounded-full h-9 px-4 shadow-sm ${quickFilter === 'agendamento' ? 'bg-purple-500 text-white hover:bg-purple-600' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}
            >
              <span className="text-base">📅</span>
              <span className="w-5 h-5 rounded-full bg-white/90 text-purple-700 text-xs flex items-center justify-center font-bold">{stats.aguardandoAgendamento}</span>
              <span className="text-sm font-semibold">Para agendar</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setQuickFilter(quickFilter === 'hoje' ? 'all' : 'hoje')}
              className={`flex-shrink-0 gap-2 rounded-full h-9 px-4 shadow-sm ${quickFilter === 'hoje' ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
            >
              <span className="text-base">🚗</span>
              <span className="w-5 h-5 rounded-full bg-white/90 text-blue-700 text-xs flex items-center justify-center font-bold">{stats.entregasHoje}</span>
              <span className="text-sm font-semibold">Entregas hoje</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setQuickFilter(quickFilter === 'concluidos' ? 'all' : 'concluidos')}
              className={`flex-shrink-0 gap-2 rounded-full h-9 px-4 shadow-sm ${quickFilter === 'concluidos' ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
            >
              <span className="text-base">✅</span>
              <span className="w-5 h-5 rounded-full bg-white/90 text-green-700 text-xs flex items-center justify-center font-bold">{stats.concluidos}</span>
              <span className="text-sm font-semibold">Processos aprovados</span>
            </Button>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="border-b border-slate-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="gap-2 text-slate-600">
              <Search className="w-4 h-4" />
              Refinar
            </Button>
            <Button variant="ghost" size="sm" className="gap-2 text-slate-600">
              <Filter className="w-4 h-4" />
              Ordenar
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">
              <span className="font-semibold">{filteredOrders.length}</span> processos encontrados
            </span>
            <Link to={createPageUrl('NewOrder')}>
              <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700 rounded-full px-4">
                <Plus className="w-4 h-4" />
                Novo Pedido
              </Button>
            </Link>
          </div>
        </div>

        {/* Orders List */}
        <div className="px-6 py-4">
          <div className="space-y-3">
            {recentOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Link to={createPageUrl(`OrderDetails?id=${order.id}`)}>
                  <div className="bg-white border border-slate-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all group">
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: Order Number */}
                      <div className="flex-shrink-0">
                        <div className="text-2xl font-bold text-slate-800">
                          {order.tracking_code.split('-')[1]}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {format(new Date(order.created_date), "dd/MM/yyyy")}
                        </div>
                      </div>

                      {/* Center: Order Details */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-slate-100 rounded text-xs font-medium text-slate-700">
                            {order.vehicle_model}
                          </span>
                          <span className="text-sm text-slate-500">→</span>
                          <span className="px-3 py-1 bg-blue-50 rounded text-xs font-medium text-blue-700">
                            {order.status_publico || order.current_status}
                          </span>
                        </div>
                        
                        <div className="space-y-1 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Nome:</span>
                            <span>{order.client_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Email:</span>
                            <span className="truncate">{order.client_email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Telefone:</span>
                            <span>{order.client_phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Código:</span>
                            <span className="font-mono text-xs">{order.tracking_code}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-9 h-9 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600"
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 text-xs"
                        >
                          VER DETALHES
                        </Button>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
            
            {recentOrders.length === 0 && (
              <div className="text-center py-12">
                <Car className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">Nenhum pedido encontrado</p>
                <p className="text-slate-400 text-sm mt-1">
                  {searchTerm ? 'Tente outro termo de busca' : 'Crie seu primeiro pedido'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}