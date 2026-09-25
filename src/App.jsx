import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import LoginScreen from './components/LoginScreen';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import Repairs from './components/Repairs';
import Inventory from './components/Inventory';
import CategoriesView from './components/CategoriesView';
import SettingsView from './components/SettingsView';
import Credits from './components/Credits';
import ClientsView from './components/ClientsView';
import SalesHistory from './components/SalesHistory';
import Expenses from './components/Expenses';
import CashSessions from './components/CashSessions';
import PurchaseOrders from './components/PurchaseOrders';
import Archives from './components/Archives';
import ProductModal from './components/ProductModal';
import RepairModal from './components/RepairModal';
import ExpenseModal from './components/ExpenseModal';
import PurchaseOrderModal from './components/PurchaseOrderModal';
import PaymentModal from './components/PaymentModal';
import CreditPaymentModal from './components/CreditPaymentModal';
import SettingsModal from './components/SettingsModal';
import PrintReceipt from './components/PrintReceipt';
import { Toaster } from 'sonner';

function MainShopApp() {
  const { currentTab, setCurrentTab, activeReceipt, setActiveReceipt, isRTL, settings, isLoggedIn, isAdmin } = useApp();

  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  // Modal states
  const [productModalData, setProductModalData] = useState({ open: false, product: null });
  const [repairModalData, setRepairModalData] = useState({ open: false, repair: null });
  const [expenseModalData, setExpenseModalData] = useState({ open: false, expense: null });
  const [purchaseOrderModalData, setPurchaseOrderModalData] = useState({ open: false, order: null });
  const [paymentModalData, setPaymentModalData] = useState({
    open: false,
    cart: [],
    totalAmount: 0,
    totalProfit: 0,
    onSuccess: null,
  });
  const [creditPayModalData, setCreditPayModalData] = useState({ open: false, client: null });
  const [showSettings, setShowSettings] = useState(false);

  // Handlers
  const handleOpenNewSale = () => {
    setCurrentTab('pos');
  };

  const handleOpenNewRepair = () => {
    setRepairModalData({ open: true, repair: null });
  };

  const handleEditRepair = (repair) => {
    setRepairModalData({ open: true, repair });
  };

  const handleOpenNewExpense = () => {
    setExpenseModalData({ open: true, expense: null });
  };

  const handleEditExpense = (expense) => {
    setExpenseModalData({ open: true, expense });
  };

  const handleOpenNewPurchaseOrder = () => {
    setPurchaseOrderModalData({ open: true, order: null });
  };

  const handleEditPurchaseOrder = (order) => {
    setPurchaseOrderModalData({ open: true, order });
  };

  const handleOpenNewProduct = () => {
    setProductModalData({ open: true, product: null });
  };

  const handleEditProduct = (product) => {
    setProductModalData({ open: true, product });
  };

  const handleOpenPayment = (cart, totalAmount, totalProfit, onSuccess) => {
    setPaymentModalData({
      open: true,
      cart,
      totalAmount,
      totalProfit,
      onSuccess,
    });
  };

  const handlePayCredit = (client) => {
    setCreditPayModalData({ open: true, client });
  };

  return (
    <div className="layout-with-sidebar">
      {/* Sidebar Navigation */}
      <Sidebar
        onOpenNewSale={handleOpenNewSale}
        onOpenNewRepair={handleOpenNewRepair}
        onOpenNewExpense={handleOpenNewExpense}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* Main Content Layout */}
      <div className="layout-main-wrapper">
        <TopHeader onOpenSettings={() => setShowSettings(true)} />

        <main className={`main-content-scroll ${currentTab === 'pos' ? 'pos-main-container' : ''}`}>
          {currentTab === 'dashboard' && (
            <Dashboard
              onNewSale={handleOpenNewSale}
              onNewRepair={handleOpenNewRepair}
              onNewExpense={handleOpenNewExpense}
              onSelectRepair={handleEditRepair}
            />
          )}

          {currentTab === 'pos' && (
            <POS onOpenPaymentModal={handleOpenPayment} />
          )}

          {currentTab === 'repairs' && (
            <Repairs
              onOpenNewRepair={handleOpenNewRepair}
              onEditRepair={handleEditRepair}
            />
          )}

          {currentTab === 'inventory' && (
            <Inventory
              onOpenNewProduct={handleOpenNewProduct}
              onEditProduct={handleEditProduct}
            />
          )}

          {currentTab === 'purchase_orders' && (
            <PurchaseOrders
              onOpenNewOrder={handleOpenNewPurchaseOrder}
              onEditOrder={handleEditPurchaseOrder}
            />
          )}

          {currentTab === 'expenses' && (
            isAdmin ? (
              <Expenses
                onOpenNewExpense={handleOpenNewExpense}
                onEditExpense={handleEditExpense}
              />
            ) : <POS onOpenPayment={handleOpenPayment} />
          )}

          {currentTab === 'sessions' && (
            isAdmin ? <CashSessions /> : <POS onOpenPayment={handleOpenPayment} />
          )}

          {(currentTab === 'settings' || currentTab === 'categories') && (
            isAdmin ? <SettingsView /> : <POS onOpenPayment={handleOpenPayment} />
          )}

          {currentTab === 'credits' && (
            <Credits
              onOpenPaymentModal={handleOpenPayment}
              onPayCredit={handlePayCredit}
            />
          )}

          {currentTab === 'sales_history' && (
            <SalesHistory onEditRepair={handleEditRepair} />
          )}

          {currentTab === 'clients' && (
            <ClientsView />
          )}

          {currentTab === 'archives' && (
            <Archives onSelectRepair={handleEditRepair} />
          )}
        </main>
      </div>

      {/* Global Modals */}
      {productModalData.open && (
        <ProductModal
          product={productModalData.product}
          onClose={() => setProductModalData({ open: false, product: null })}
        />
      )}

      {repairModalData.open && (
        <RepairModal
          repair={repairModalData.repair}
          onClose={() => setRepairModalData({ open: false, repair: null })}
        />
      )}

      {expenseModalData.open && (
        <ExpenseModal
          expense={expenseModalData.expense}
          onClose={() => setExpenseModalData({ open: false, expense: null })}
        />
      )}

      {purchaseOrderModalData.open && (
        <PurchaseOrderModal
          order={purchaseOrderModalData.order}
          onClose={() => setPurchaseOrderModalData({ open: false, order: null })}
        />
      )}

      {paymentModalData.open && (
        <PaymentModal
          cart={paymentModalData.cart}
          totalAmount={paymentModalData.totalAmount}
          totalProfit={paymentModalData.totalProfit}
          onClose={() => setPaymentModalData({ open: false, cart: [], totalAmount: 0, totalProfit: 0, onSuccess: null })}
          onComplete={() => {
            if (paymentModalData.onSuccess) paymentModalData.onSuccess();
            setPaymentModalData({ open: false, cart: [], totalAmount: 0, totalProfit: 0, onSuccess: null });
          }}
        />
      )}

      {creditPayModalData.open && (
        <CreditPaymentModal
          client={creditPayModalData.client}
          onClose={() => setCreditPayModalData({ open: false, client: null })}
        />
      )}

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}

      {/* Printable Receipt Modal */}
      {activeReceipt && (
        <PrintReceipt
          receiptData={activeReceipt}
          onClose={() => setActiveReceipt(null)}
        />
      )}

      {/* Global Toast Notifications (10s auto-close) */}
      <Toaster
        position={isRTL ? 'top-left' : 'top-right'}
        duration={10000}
        richColors
        closeButton
        theme={settings?.theme === 'light' ? 'light' : 'dark'}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainShopApp />
    </AppProvider>
  );
}

