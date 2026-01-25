import Layout from "./Layout.jsx";

import Avaliacao from "./Avaliacao";

import Dashboard from "./Dashboard";

import IPVACalculator from "./IPVACalculator";

import NewOrder from "./NewOrder";

import OrderDetails from "./OrderDetails";

import Pedido from "./Pedido";

import Schedules from "./Schedules";

import Settings from "./Settings";

import Tracking from "./Tracking";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Avaliacao: Avaliacao,
    
    Dashboard: Dashboard,
    
    IPVACalculator: IPVACalculator,
    
    NewOrder: NewOrder,
    
    OrderDetails: OrderDetails,
    
    Pedido: Pedido,
    
    Schedules: Schedules,
    
    Settings: Settings,
    
    Tracking: Tracking,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Avaliacao />} />
                
                
                <Route path="/Avaliacao" element={<Avaliacao />} />
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/IPVACalculator" element={<IPVACalculator />} />
                
                <Route path="/NewOrder" element={<NewOrder />} />
                
                <Route path="/OrderDetails" element={<OrderDetails />} />
                
                <Route path="/Pedido" element={<Pedido />} />
                
                <Route path="/Schedules" element={<Schedules />} />
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/Tracking" element={<Tracking />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}