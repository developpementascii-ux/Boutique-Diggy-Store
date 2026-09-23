import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';
import {
  X,
  Wrench,
  AlertTriangle,
  CheckCircle,
  Smartphone,
  Search,
  Package,
  Layers,
  Tag,
  Check,
  RotateCcw,
  Plus,
  Trash2,
  ExternalLink,
  ChevronDown,
  Filter,
  User,
  Crown,
  Phone,
} from 'lucide-react';

export default function RepairModal({ repair, onClose }) {
  const {
    addRepair,
    updateRepair,
    products,
    categories,
    clients,
    getClientStats,
    isProductLowStock,
    formatMoney,
    setActiveReceipt,
    t,
    lang,
    settings,
  } = useApp();

  const isEditing = Boolean(repair);

  // Helper to format ISO date string to "YYYY-MM-DDTHH:mm" for datetime-local inputs
  const formatDatetimeForInput = (isoStr) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return '';
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return '';
    }
  };

  const [formData, setFormData] = useState({
    clientId: '',
    clientName: '',
    clientPhone: '',
    deviceModel: '',
    issueDescription: '',
    pieceUsedId: '',
    pieceName: '',
    pieceCost: 0,
    laborCost: 0,
    totalPrice: 0,
    advancePaid: 0,
    deductStock: true,
    status: 'received',
    priority: 'normal',
    notes: '',
    expectedDate: '',
    createdAt: formatDatetimeForInput(new Date().toISOString()),
    deliveredAt: '',
  });

  // Source mode for piece: 'stock' | 'external' | 'none'
  const [pieceSourceMode, setPieceSourceMode] = useState('stock');
  const [showStockPicker, setShowStockPicker] = useState(true);

  // Filters for stock pieces (Multi-category & Subcategory browser)
  const [pieceCategory, setPieceCategory] = useState(() => {
    // If a mobile_pieces category exists, default to it, otherwise 'all'
    const hasMobilePieces = categories.some((c) => c.id === 'mobile_pieces');
    return hasMobilePieces ? 'mobile_pieces' : 'all';
  });
  const [pieceSubCategory, setPieceSubCategory] = useState('all');
  const [pieceSearch, setPieceSearch] = useState('');
  const [onlyInStock, setOnlyInStock] = useState(false);

  useEffect(() => {
    if (repair) {
      const hasStockPiece = Boolean(repair.pieceUsedId);
      const hasExternalPiece = Boolean(!repair.pieceUsedId && repair.pieceName);

      const effectiveAdvance = repair.initialAdvance !== undefined
        ? Number(repair.initialAdvance)
        : (repair.status === 'delivered' ? Math.max(0, (Number(repair.totalPrice) || 0) - (Number(repair.remainingPaid) || 0)) : (Number(repair.advancePaid) || 0));

      const effectiveRemaining = repair.remainingPaid !== undefined && repair.status === 'delivered'
        ? Number(repair.remainingPaid)
        : (repair.remainingDue !== undefined ? Number(repair.remainingDue) : Math.max(0, (Number(repair.totalPrice) || 0) - effectiveAdvance));

      const rawIssue = repair.issueDescription || repair.problemDescription || repair.problem || repair.diagnostic || repair.description || '';
      const rawDate = repair.createdAt || repair.date || new Date().toISOString();
      const rawDelivered = repair.deliveredAt || '';

      setFormData({
        clientId: repair.clientId || '',
        clientName: repair.clientName || '',
        clientPhone: repair.clientPhone || '',
        deviceModel: repair.deviceModel || repair.model || '',
        issueDescription: rawIssue,
        pieceUsedId: repair.pieceUsedId || '',
        pieceName: repair.pieceName || '',
        pieceCost: repair.pieceCost || 0,
        laborCost: repair.laborCost !== undefined ? repair.laborCost : 0,
        totalPrice: repair.totalPrice !== undefined ? repair.totalPrice : 0,
        advancePaid: effectiveAdvance,
        remainingDue: effectiveRemaining,
        deductStock: repair.deductStock !== undefined ? repair.deductStock : true,
        status: repair.status || 'received',
        priority: repair.priority || 'normal',
        notes: repair.notes || '',
        expectedDate: repair.expectedDate || '',
        createdAt: formatDatetimeForInput(rawDate),
        deliveredAt: formatDatetimeForInput(rawDelivered),
      });

      if (hasStockPiece) {
        setPieceSourceMode('stock');
        setShowStockPicker(false);
      } else if (hasExternalPiece) {
        setPieceSourceMode('external');
      } else {
        setPieceSourceMode('none');
      }
    }
  }, [repair]);

  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [isClientSearchOpen, setIsClientSearchOpen] = useState(false);

  // Sorted list of declared loyalty clients (Alphabetical A-Z)
  const sortedLoyaltyClients = useMemo(() => {
    return (clients || [])
      .filter((c) => c && (c.isLoyaltyClient || c.id === formData.clientId))
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));
  }, [clients, formData.clientId]);

  // Filtered list based on search query (name or phone)
  const filteredLoyaltyClients = useMemo(() => {
    const q = clientSearchQuery.toLowerCase().trim();
    if (!q) return sortedLoyaltyClients;
    return sortedLoyaltyClients.filter((c) => {
      const matchName = c.name && c.name.toLowerCase().includes(q);
      const matchPhone = c.phone && c.phone.toLowerCase().includes(q);
      return matchName || matchPhone;
    });
  }, [sortedLoyaltyClients, clientSearchQuery]);

  const handleSelectClient = (selectedId) => {
    if (!selectedId) {
      setFormData((prev) => ({
        ...prev,
        clientId: '',
      }));
      return;
    }
    const found = (clients || []).find((c) => c.id === selectedId);
    if (found) {
      setFormData((prev) => ({
        ...prev,
        clientId: found.id,
        clientName: found.name || '',
        clientPhone: found.phone || prev.clientPhone || '',
      }));
    }
  };

  const selectedClientStats = formData.clientId ? getClientStats(formData.clientId) : null;

  // Selected product object from stock if any
  const selectedProduct = useMemo(() => {
    if (!formData.pieceUsedId) return null;
    return products.find((p) => p.id === formData.pieceUsedId) || null;
  }, [formData.pieceUsedId, products]);

  // Sub-categories available for the chosen category
  const availableSubCategories = useMemo(() => {
    if (pieceCategory === 'all') {
      const allSubs = products.map((p) => p.subCategory).filter(Boolean);
      return Array.from(new Set(allSubs));
    }
    const catObj = categories.find((c) => c.id === pieceCategory);
    const definedSubs = catObj?.subCategories || [];
    const fromProducts = products
      .filter((p) => p.category === pieceCategory && p.subCategory && p.subCategory.trim())
      .map((p) => p.subCategory.trim());
    return Array.from(new Set([...definedSubs, ...fromProducts]));
  }, [pieceCategory, categories, products]);

  // Filtered product items for stock browser
  const filteredStockProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = pieceCategory === 'all' || p.category === pieceCategory;
      const matchSub =
        pieceSubCategory === 'all' ||
        (p.subCategory && p.subCategory.trim().toLowerCase() === pieceSubCategory.trim().toLowerCase());
      const q = pieceSearch.toLowerCase().trim();
      const matchQ =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.subCategory && p.subCategory.toLowerCase().includes(q));
      const matchStock = !onlyInStock || Number(p.stock) > 0;

      return matchCat && matchSub && matchQ && matchStock;
    });
  }, [products, pieceCategory, pieceSubCategory, pieceSearch, onlyInStock]);

  const handleSelectProduct = (prod) => {
    const cost = Number(prod.sellingPrice) || 0;
    setFormData((prev) => {
      const labor = Number(prev.laborCost) || 0;
      return {
        ...prev,
        pieceUsedId: prod.id,
        pieceName: prod.name,
        pieceCost: cost,
        totalPrice: cost + labor,
      };
    });
    setShowStockPicker(false);
  };

  const handleClearStockPiece = () => {
    setFormData((prev) => {
      const labor = Number(prev.laborCost) || 0;
      return {
        ...prev,
        pieceUsedId: '',
        pieceName: '',
        pieceCost: 0,
        totalPrice: labor,
      };
    });
    setShowStockPicker(true);
  };

  const handleSwitchMode = (mode) => {
    setPieceSourceMode(mode);
    if (mode === 'none') {
      setFormData((prev) => {
        const labor = Number(prev.laborCost) || 0;
        return {
          ...prev,
          pieceUsedId: '',
          pieceName: '',
          pieceCost: 0,
          totalPrice: labor,
        };
      });
    } else if (mode === 'external') {
      setFormData((prev) => {
        const labor = Number(prev.laborCost) || 0;
        return {
          ...prev,
          pieceUsedId: '',
          totalPrice: (Number(prev.pieceCost) || 0) + labor,
        };
      });
    } else if (mode === 'stock') {
      setShowStockPicker(true);
    }
  };

  const handlePieceCostChange = (val) => {
    const cost = Number(val) || 0;
    setFormData((prev) => {
      const labor = Number(prev.laborCost) || 0;
      const total = cost + labor;
      const adv = Number(prev.advancePaid) || 0;
      return {
        ...prev,
        pieceCost: val,
        totalPrice: total,
        remainingDue: Math.max(0, total - adv),
      };
    });
  };

  const handleLaborChange = (val) => {
    const labor = Number(val) || 0;
    setFormData((prev) => {
      const piece = Number(prev.pieceCost) || 0;
      const total = piece + labor;
      const adv = Number(prev.advancePaid) || 0;
      return {
        ...prev,
        laborCost: val,
        totalPrice: total,
        remainingDue: Math.max(0, total - adv),
      };
    });
  };

  const handleTotalPriceChange = (val) => {
    const total = Number(val) || 0;
    setFormData((prev) => {
      const piece = Number(prev.pieceCost) || 0;
      const adv = Number(prev.advancePaid) || 0;
      return {
        ...prev,
        totalPrice: val,
        laborCost: Math.max(0, total - piece),
        remainingDue: Math.max(0, total - adv),
      };
    });
  };

  const handleAdvanceChange = (val) => {
    const adv = Number(val) || 0;
    setFormData((prev) => {
      const total = Number(prev.totalPrice) || 0;
      return {
        ...prev,
        advancePaid: val,
        remainingDue: Math.max(0, total - adv),
      };
    });
  };

  const handleRemainingDueChange = (val) => {
    const rem = Number(val) || 0;
    setFormData((prev) => {
      const total = Number(prev.totalPrice) || 0;
      return {
        ...prev,
        remainingDue: val,
        advancePaid: Math.max(0, total - rem),
      };
    });
  };

  const remainingDue = formData.remainingDue !== undefined
    ? Number(formData.remainingDue)
    : Math.max(0, (Number(formData.totalPrice) || 0) - (Number(formData.advancePaid) || 0));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.deviceModel.trim()) return;

    const finalCreatedAt = formData.createdAt ? new Date(formData.createdAt).toISOString() : (repair?.createdAt || new Date().toISOString());
    const finalDeliveredAt = formData.status === 'delivered'
      ? (formData.deliveredAt ? new Date(formData.deliveredAt).toISOString() : (repair?.deliveredAt || finalCreatedAt))
      : null;

    const payload = {
      ...formData,
      createdAt: finalCreatedAt,
      deliveredAt: finalDeliveredAt,
      pieceCost,
      laborCost,
      totalPrice,
      initialAdvance: advancePaid,
      advancePaid,
      remainingDue: remDue,
    };

    if (isEditing) {
      updateRepair(repair.id, payload);
      toast.success(
        lang === 'ar'
          ? `تم تحديث تذكرة الصيانة (${repair.ticketNumber}) بنجاح`
          : lang === 'en'
          ? `Repair ticket (${repair.ticketNumber}) updated successfully`
          : `Fiche de réparation (${repair.ticketNumber}) modifiée avec succès !`
      );
      onClose();
    } else {
      const created = addRepair(payload);
      toast.success(
        lang === 'ar'
          ? `تم تسجيل تذكرة الصيانة (${created.ticketNumber}) بنجاح`
          : lang === 'en'
          ? `Repair ticket (${created.ticketNumber}) registered successfully`
          : `Fiche de réparation (${created.ticketNumber}) enregistrée avec succès !`,
        {
          action: {
            label: lang === 'ar' ? '🖨️ طباعة الوصل' : lang === 'en' ? '🖨️ Print Ticket' : '🖨️ Imprimer Ticket',
            onClick: () => setActiveReceipt({ type: 'repair', data: created }),
          },
        }
      );
      onClose();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '780px', maxHeight: '94vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Wrench size={20} className="text-primary" />
            {isEditing
              ? `${t('editRepairModalTitle') || t('editRepairModal')} (${repair.ticketNumber})`
              : (t('newRepairModalTitle') || t('newRepairModal'))}
          </h3>
          <button type="button" className="btn-icon btn-outline" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {/* 1. Client Info / Affectation Client */}
            <div
              style={{
                background: 'var(--bg-secondary)',
                padding: '0.9rem',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                  <User size={15} className="text-primary" />
                  <span>{lang === 'ar' ? 'اختيار / تعيين الحريف' : 'Client & Affectation du Dossier'}</span>
                </label>

                {selectedClientStats && (
                  <span
                    className="badge"
                    style={{
                      background: selectedClientStats.loyaltyTier === 'platinum'
                        ? 'linear-gradient(135deg, rgba(229, 231, 235, 0.25), rgba(168, 85, 247, 0.25))'
                        : selectedClientStats.loyaltyTier === 'gold'
                        ? 'rgba(245, 158, 11, 0.2)'
                        : selectedClientStats.loyaltyTier === 'silver'
                        ? 'rgba(148, 163, 184, 0.2)'
                        : 'rgba(205, 127, 50, 0.15)',
                      color: selectedClientStats.loyaltyTier === 'platinum'
                        ? '#c084fc'
                        : selectedClientStats.loyaltyTier === 'gold'
                        ? '#fbbf24'
                        : selectedClientStats.loyaltyTier === 'silver'
                        ? '#94a3b8'
                        : '#d97706',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    <Crown size={12} />
                    {selectedClientStats.loyaltyTier.toUpperCase()} ({selectedClientStats.points} {t('points')})
                  </span>
                )}
              </div>

              {/* Searchable Client Selector & Free Ticket Name */}
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'grid', gridTemplateColumns: formData.clientId ? '1fr 1fr' : '1.2fr 1fr 1fr', gap: '0.65rem' }}>
                  {/* Searchable Input Container */}
                  <div style={{ position: 'relative' }}>
                    <label className="form-label" style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                      {lang === 'ar' ? 'حريف مسجل (أ-ي أو هاتف)' : 'Client Enregistré (A-Z ou Tél)'}
                    </label>
                    <div className="input-with-icon" style={{ position: 'relative' }}>
                      <Search size={15} style={{ color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        className="form-input"
                        placeholder={
                          formData.clientId
                            ? `⭐ ${formData.clientName}`
                            : (lang === 'ar' ? '🔍 ابحث بالاسم أو الهاتف...' : '🔍 Rechercher client...')
                        }
                        value={isClientSearchOpen ? clientSearchQuery : (formData.clientId ? `⭐ ${formData.clientName}` : '')}
                        onFocus={() => {
                          setIsClientSearchOpen(true);
                          setClientSearchQuery('');
                        }}
                        onChange={(e) => {
                          setClientSearchQuery(e.target.value);
                          setIsClientSearchOpen(true);
                        }}
                        style={{
                          fontWeight: formData.clientId ? 600 : 400,
                          paddingRight: '2rem',
                          borderColor: formData.clientId ? 'var(--accent-primary)' : undefined,
                        }}
                      />
                      {formData.clientId ? (
                        <button
                          type="button"
                          className="btn-icon"
                          style={{
                            position: 'absolute',
                            right: lang === 'ar' ? 'unset' : '8px',
                            left: lang === 'ar' ? '8px' : 'unset',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '2px',
                          }}
                          title={lang === 'ar' ? 'إلغاء التعيين / زبون ورشة' : 'Désélectionner (Passager)'}
                          onClick={() => {
                            handleSelectClient('');
                            setClientSearchQuery('');
                            setIsClientSearchOpen(false);
                          }}
                        >
                          <X size={14} />
                        </button>
                      ) : (
                        <ChevronDown
                          size={14}
                          style={{
                            position: 'absolute',
                            right: lang === 'ar' ? 'unset' : '10px',
                            left: lang === 'ar' ? '10px' : 'unset',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--text-muted)',
                            pointerEvents: 'none',
                          }}
                        />
                      )}
                    </div>

                    {/* Search Dropdown Popup */}
                    {isClientSearchOpen && (
                      <>
                        <div
                          style={{ position: 'fixed', inset: 0, zIndex: 99 }}
                          onClick={() => setIsClientSearchOpen(false)}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            marginTop: '4px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '10px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.35)',
                            zIndex: 100,
                            maxHeight: '220px',
                            overflowY: 'auto',
                          }}
                        >
                          {/* Option: Walk-in / Passager */}
                          <div
                            style={{
                              padding: '0.6rem 0.85rem',
                              cursor: 'pointer',
                              borderBottom: '1px solid var(--border-color)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: !formData.clientId ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                              fontWeight: !formData.clientId ? 700 : 400,
                              fontSize: '0.82rem',
                            }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleSelectClient('');
                              setIsClientSearchOpen(false);
                            }}
                          >
                            <span style={{ color: 'var(--text-primary)' }}>
                              👤 {lang === 'ar' ? 'زبون عابر / ورشة (بدون حساب)' : '👤 Client Passager / Atelier'}
                            </span>
                            {!formData.clientId && <Check size={14} className="text-primary" />}
                          </div>

                          {/* Filtered & Sorted Clients List */}
                          {filteredLoyaltyClients.length === 0 ? (
                            <div style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {lang === 'ar' ? 'لا يوجد زبون بهذا الاسم' : 'Aucun client fidélité trouvé'}
                            </div>
                          ) : (
                            filteredLoyaltyClients.map((c) => {
                              const isSelected = formData.clientId === c.id;
                              const stats = getClientStats(c.id);
                              return (
                                <div
                                  key={c.id}
                                  style={{
                                    padding: '0.55rem 0.85rem',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                                    fontSize: '0.82rem',
                                  }}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleSelectClient(c.id);
                                    setIsClientSearchOpen(false);
                                  }}
                                >
                                  <div>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                      ⭐ {c.name}
                                    </div>
                                    {c.phone && (
                                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                        📞 {c.phone}
                                      </div>
                                    )}
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    {stats && (
                                      <span
                                        className="badge"
                                        style={{
                                          fontSize: '0.68rem',
                                          padding: '0.15rem 0.4rem',
                                          background: stats.loyaltyTier === 'platinum'
                                            ? 'rgba(168, 85, 247, 0.2)'
                                            : stats.loyaltyTier === 'gold'
                                            ? 'rgba(245, 158, 11, 0.2)'
                                            : 'rgba(148, 163, 184, 0.2)',
                                          color: stats.loyaltyTier === 'gold' ? '#fbbf24' : stats.loyaltyTier === 'platinum' ? '#c084fc' : '#94a3b8',
                                        }}
                                      >
                                        {stats.loyaltyTier.toUpperCase()}
                                      </span>
                                    )}
                                    {Number(c.totalDebt) > 0 && (
                                      <span className="badge badge-red privacy-blur" style={{ fontSize: '0.68rem', padding: '0.15rem 0.4rem' }}>
                                        🔴 Dette: {formatMoney(c.totalDebt)}
                                      </span>
                                    )}
                                    {isSelected && <Check size={14} className="text-primary" />}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Client Name on Ticket (only if not already linked or to override) */}
                  {!formData.clientId && (
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                        {t('clientName')}{' '}
                        <span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--text-muted)' }}>
                          ({t('optional')})
                        </span>
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder={lang === 'ar' ? 'اسم الحريف على الوصل...' : 'Nom libre sur le ticket...'}
                        value={formData.clientName}
                        onChange={(e) => setFormData((prev) => ({ ...prev, clientName: e.target.value }))}
                      />
                    </div>
                  )}

                  {/* Client Phone */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                      {t('clientPhone')}{' '}
                      <span style={{ fontSize: '0.7rem', fontWeight: 400, color: 'var(--text-muted)' }}>
                        ({t('optional')})
                      </span>
                    </label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder={lang === 'ar' ? 'مثال: 98 123 456' : 'Ex: 98 123 456'}
                      value={formData.clientPhone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, clientPhone: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Device and Priority */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">{t('deviceModel')} *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={lang === 'ar' ? 'مثال: سامسونج جالكسي A51، آيفون 12...' : lang === 'en' ? 'Ex: Samsung Galaxy A51, iPhone 12...' : 'Ex: Samsung Galaxy A51, iPhone 12...'}
                  value={formData.deviceModel}
                  onChange={(e) => setFormData({ ...formData, deviceModel: e.target.value })}
                  required
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">{t('priority')}</label>
                <select
                  className="form-select"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="normal">{t('priorityNormal')}</option>
                  <option value="high">{t('priorityHigh')}</option>
                  <option value="urgent">🔴 {t('priorityUrgent')}</option>
                </select>
              </div>
            </div>

            {/* 3. Issue Description */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">{t('issueDescription')} *</label>
              <textarea
                className="form-textarea"
                rows="2"
                placeholder={lang === 'ar' ? 'مثال: شاشة مكسورة، مشكل في الشحن، بطارية...' : lang === 'en' ? 'Ex: Broken screen, charging port issue, battery replacement...' : 'Ex: Écran cassé tactile HS, connecteur de charge dessoudé, nappe power, batterie...'}
                value={formData.issueDescription}
                onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
                required
              />
            </div>

            {/* 4. PIÈCE DE RECHANGE AVEC NAVIGATION MULTI-CATÉGORIES & FILTRES */}
            <div
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '1.1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.85rem',
              }}
            >
              {/* Header with Mode Tabs */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Wrench size={17} className="text-primary" />
                  <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                    {t('sparePart')}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    background: 'var(--bg-card)',
                    padding: '0.2rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    gap: '0.2rem',
                  }}
                >
                  <button
                    type="button"
                    className={`btn btn-sm ${pieceSourceMode === 'stock' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ border: 'none', padding: '0.25rem 0.6rem', fontSize: '0.78rem' }}
                    onClick={() => handleSwitchMode('stock')}
                  >
                    <Package size={13} />
                    <span>{t('tabStockPiece')}</span>
                  </button>

                  <button
                    type="button"
                    className={`btn btn-sm ${pieceSourceMode === 'external' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ border: 'none', padding: '0.25rem 0.6rem', fontSize: '0.78rem' }}
                    onClick={() => handleSwitchMode('external')}
                  >
                    <span>{t('tabExternalPiece')}</span>
                  </button>

                  <button
                    type="button"
                    className={`btn btn-sm ${pieceSourceMode === 'none' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ border: 'none', padding: '0.25rem 0.6rem', fontSize: '0.78rem' }}
                    onClick={() => handleSwitchMode('none')}
                  >
                    <span>{t('tabNoPiece')}</span>
                  </button>
                </div>
              </div>

              {/* MODE A: STOCK SELECTION */}
              {pieceSourceMode === 'stock' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {/* Selected Piece Summary Card (when piece is chosen and picker is minimized) */}
                  {selectedProduct && !showStockPicker ? (
                    <div
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--accent-primary)',
                        borderRadius: '10px',
                        padding: '0.85rem 1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.75rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '8px',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            flexShrink: 0,
                          }}
                        >
                          {selectedProduct.image ? (
                            <img
                              src={selectedProduct.image}
                              alt={selectedProduct.name}
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                          ) : (
                            <Package size={20} className="text-primary" />
                          )}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.2rem' }}>
                            <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                              {selectedProduct.name}
                            </strong>
                            <span
                              className="badge"
                              style={{
                                background: Number(selectedProduct.stock) > 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: Number(selectedProduct.stock) > 0 ? '#10b981' : '#f87171',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                              }}
                            >
                              {selectedProduct.stock} {t('inStock')}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '0.6rem' }}>
                            <span>{selectedProduct.subCategory || selectedProduct.category}</span>
                            <span>•</span>
                            <span className="privacy-blur" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                              {t('salePriceCol')}: {formatMoney(selectedProduct.sellingPrice)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}
                          onClick={() => setShowStockPicker(true)}
                        >
                          <RotateCcw size={13} />
                          {t('changeStockPiece')}
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem', color: 'var(--accent-danger)' }}
                          onClick={handleClearStockPiece}
                        >
                          <Trash2 size={13} />
                          {t('removeStockPiece')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Product Browser (Categories, Subcategories, Search, Product List) */
                    <div
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        padding: '0.85rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                      }}
                    >
                      {/* Row 1: Category Filter Chips */}
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                          {t('categoryCol')} :
                        </span>
                        <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
                          <button
                            type="button"
                            className={`btn btn-sm ${pieceCategory === 'all' ? 'btn-primary' : 'btn-outline'}`}
                            style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', whiteSpace: 'nowrap' }}
                            onClick={() => {
                              setPieceCategory('all');
                              setPieceSubCategory('all');
                            }}
                          >
                            {t('all')} ({products.length})
                          </button>

                          {categories.map((cat) => {
                            const catProdCount = products.filter((p) => p.category === cat.id).length;
                            const isSelected = pieceCategory === cat.id;
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-outline'}`}
                                style={{
                                  fontSize: '0.75rem',
                                  padding: '0.2rem 0.6rem',
                                  whiteSpace: 'nowrap',
                                  borderColor: isSelected ? cat.color : undefined,
                                }}
                                onClick={() => {
                                  setPieceCategory(cat.id);
                                  setPieceSubCategory('all');
                                }}
                              >
                                <span>{cat.label}</span>
                                <span style={{ opacity: 0.8, fontSize: '0.68rem' }}>({catProdCount})</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Row 2: Subcategory Filter Chips (if any available) */}
                      {availableSubCategories.length > 0 && (
                        <div>
                          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                            {t('subCategoryCol')} :
                          </span>
                          <div style={{ display: 'flex', gap: '0.3rem', overflowX: 'auto', paddingBottom: '0.2rem', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className={`btn btn-sm ${pieceSubCategory === 'all' ? 'btn-secondary' : 'btn-outline'}`}
                              style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', whiteSpace: 'nowrap' }}
                              onClick={() => setPieceSubCategory('all')}
                            >
                              {t('all')}
                            </button>
                            {availableSubCategories.map((sub, idx) => {
                              const isSubSelected = pieceSubCategory === sub;
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  className={`btn btn-sm ${isSubSelected ? 'btn-secondary' : 'btn-outline'}`}
                                  style={{
                                    fontSize: '0.72rem',
                                    padding: '0.15rem 0.5rem',
                                    whiteSpace: 'nowrap',
                                    background: isSubSelected ? 'var(--accent-primary-light)' : 'transparent',
                                    color: isSubSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                                    borderColor: isSubSelected ? 'var(--accent-primary)' : 'var(--border-color)',
                                    fontWeight: isSubSelected ? 700 : 400,
                                  }}
                                  onClick={() => setPieceSubCategory(sub)}
                                >
                                  {sub}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Row 3: Search Bar & Stock Filter Toggle */}
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div className="input-with-icon" style={{ flex: 1, minWidth: '200px' }}>
                          <Search size={14} />
                          <input
                            type="text"
                            className="form-input"
                            style={{ height: '34px', fontSize: '0.8rem', paddingLeft: lang === 'ar' ? '0.75rem' : '2rem', paddingRight: lang === 'ar' ? '2rem' : '0.75rem' }}
                            placeholder={t('searchPiecePlaceholder')}
                            value={pieceSearch}
                            onChange={(e) => setPieceSearch(e.target.value)}
                          />
                          {pieceSearch && (
                            <button
                              type="button"
                              onClick={() => setPieceSearch('')}
                              style={{
                                position: 'absolute',
                                [lang === 'ar' ? 'left' : 'right']: '8px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                              }}
                            >
                              <X size={13} />
                            </button>
                          )}
                        </div>

                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            userSelect: 'none',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={onlyInStock}
                            onChange={(e) => setOnlyInStock(e.target.checked)}
                          />
                          <span>{t('onlyInStockLabel')}</span>
                        </label>
                      </div>

                      {/* Row 4: Products Results List */}
                      <div
                        style={{
                          maxHeight: '200px',
                          overflowY: 'auto',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.4rem',
                          paddingRight: '0.2rem',
                        }}
                      >
                        {filteredStockProducts.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            <Package size={24} style={{ margin: '0 auto 0.35rem auto', opacity: 0.3 }} />
                            <span>{t('noData')}</span>
                          </div>
                        ) : (
                          filteredStockProducts.map((prod) => {
                            const isChosen = formData.pieceUsedId === prod.id;
                            const isStockLow = isProductLowStock(prod);
                            const isOut = Number(prod.stock) <= 0;

                            return (
                              <div
                                key={prod.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '0.5rem 0.75rem',
                                  borderRadius: '8px',
                                  background: isChosen ? 'var(--accent-primary-light)' : 'var(--bg-secondary)',
                                  border: `1px solid ${isChosen ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                  gap: '0.6rem',
                                }}
                                onClick={() => handleSelectProduct(prod)}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                                  <div
                                    style={{
                                      width: '32px',
                                      height: '32px',
                                      borderRadius: '6px',
                                      background: 'var(--bg-card)',
                                      border: '1px solid var(--border-color)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexShrink: 0,
                                      overflow: 'hidden',
                                    }}
                                  >
                                    {prod.image ? (
                                      <img src={prod.image} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                    ) : (
                                      <Package size={15} style={{ color: 'var(--text-muted)' }} />
                                    )}
                                  </div>

                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {prod.name}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', gap: '0.4rem' }}>
                                      <span>{prod.subCategory || prod.category}</span>
                                      <span>•</span>
                                      <span style={{ color: isOut ? 'var(--accent-danger)' : isStockLow ? 'var(--accent-warning)' : 'var(--accent-success)', fontWeight: 600 }}>
                                        {prod.stock} {t('inStock')}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                  <strong className="privacy-blur" style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', whiteSpace: 'nowrap' }}>
                                    {formatMoney(prod.sellingPrice)}
                                  </strong>
                                  <button
                                    type="button"
                                    className={`btn btn-sm ${isChosen ? 'btn-primary' : 'btn-outline'}`}
                                    style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectProduct(prod);
                                    }}
                                  >
                                    {isChosen ? <Check size={12} /> : t('selectPieceBtn')}
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {/* Deduct stock checkbox when stock piece is selected */}
                  {formData.pieceUsedId && (
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontSize: '0.8rem',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        paddingLeft: '0.2rem',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.deductStock}
                        onChange={(e) => setFormData({ ...formData, deductStock: e.target.checked })}
                      />
                      <span>{t('deductStockLabel')}</span>
                    </label>
                  )}
                </div>
              )}

              {/* MODE B: EXTERNAL PIECE MANUAL INPUT */}
              {pieceSourceMode === 'external' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">{t('externalPieceName')}</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={lang === 'ar' ? 'مثال: شاشة من مورد خارجي...' : lang === 'en' ? 'Ex: External screen...' : 'Ex: Afficheur externe, nappe, batterie fournisseur...'}
                      value={formData.pieceName}
                      onChange={(e) => setFormData({ ...formData, pieceName: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">{t('externalPieceCost')}</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-input"
                      placeholder="0.00"
                      value={formData.pieceCost}
                      onChange={(e) => handlePieceCostChange(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 5. Tarifs, Main d'oeuvre & Prix Total */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.85rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">{t('laborCost')}</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  placeholder="0.00"
                  value={formData.laborCost}
                  onChange={(e) => handleLaborChange(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>
                  {t('totalPriceQuoted')} *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  placeholder="0.00"
                  style={{ fontWeight: 800, borderColor: 'var(--accent-primary)', fontSize: '1.05rem' }}
                  value={formData.totalPrice}
                  onChange={(e) => handleTotalPriceChange(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ color: 'var(--accent-success)', fontWeight: 700 }}>
                  {t('advancePaid')} (DT)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  placeholder="0.00"
                  style={{ fontWeight: 700, borderColor: 'var(--accent-success)' }}
                  value={formData.advancePaid}
                  onChange={(e) => handleAdvanceChange(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ color: remainingDue > 0 ? 'var(--accent-danger)' : 'var(--accent-success)', fontWeight: 700 }}>
                  {t('remainingDue')} (DT)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input"
                  placeholder="0.00"
                  style={{ fontWeight: 700, borderColor: remainingDue > 0 ? 'var(--accent-danger)' : 'var(--accent-success)' }}
                  value={formData.remainingDue !== undefined ? formData.remainingDue : remainingDue}
                  onChange={(e) => handleRemainingDueChange(e.target.value)}
                />
              </div>
            </div>

            {/* Quick Financial Shortcuts Bar */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Raccourcis :</span>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                onClick={() => {
                  const total = Number(formData.totalPrice) || 0;
                  setFormData((prev) => ({ ...prev, advancePaid: 0, remainingDue: total }));
                }}
              >
                Sans acompte (Reste 100%)
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                onClick={() => {
                  const total = Number(formData.totalPrice) || 0;
                  const half = (total / 2).toFixed(2);
                  setFormData((prev) => ({ ...prev, advancePaid: half, remainingDue: (total - Number(half)).toFixed(2) }));
                }}
              >
                Acompte 50%
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', color: 'var(--accent-success)', borderColor: 'var(--accent-success)' }}
                onClick={() => {
                  const total = Number(formData.totalPrice) || 0;
                  setFormData((prev) => ({ ...prev, advancePaid: total, remainingDue: 0 }));
                }}
              >
                Tout payé (Reste 0 DT)
              </button>
            </div>

            {/* Remaining Due Banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                background: remainingDue > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                border: `1px solid ${remainingDue > 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
              }}
            >
              <div>
                <strong>{remainingDue > 0 ? t('remainingDebt') : 'Règlement complet :'}</strong>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {remainingDue > 0
                    ? `Acompte : ${formatMoney(formData.advancePaid || 0)} | Solde à percevoir : ${formatMoney(remainingDue)}`
                    : 'Aucun reste dû. Paiement intégral validé.'}
                </div>
              </div>
              <span
                className="privacy-blur"
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  color: remainingDue > 0 ? '#f87171' : '#34d399',
                }}
              >
                {formatMoney(remainingDue)}
              </span>
            </div>

            {/* 6. Status & Dates */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">{t('statusLabel')}</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => {
                    const newSt = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      status: newSt,
                      deliveredAt: newSt === 'delivered' && !prev.deliveredAt ? prev.createdAt : prev.deliveredAt,
                    }));
                  }}
                >
                  <option value="received">{t('statusReceived')}</option>
                  <option value="in_progress">{t('statusInProgress')}</option>
                  <option value="ready">{t('statusReady')}</option>
                  <option value="delivered">{t('statusDelivered')}</option>
                  <option value="cancelled">{t('statusCancelled')}</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">{t('repairCreationDate') || 'Date Dépôt / Création'}</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={formData.createdAt}
                  onChange={(e) => setFormData({ ...formData, createdAt: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">{t('expectedDeliveryDate')}</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.expectedDate}
                  onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
                />
              </div>

              {formData.status === 'delivered' && (
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ color: 'var(--accent-success)', fontWeight: 700 }}>
                    {t('repairDeliveryDate') || 'Date Livraison / Clôture'}
                  </label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    style={{ borderColor: 'var(--accent-success)' }}
                    value={formData.deliveredAt}
                    onChange={(e) => setFormData({ ...formData, deliveredAt: e.target.value })}
                  />
                </div>
              )}
            </div>

            {/* 7. Notes */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">{t('repairNotes')}</label>
              <input
                type="text"
                className="form-input"
                placeholder={lang === 'ar' ? 'رمز القفل 1234، بدون شريحة، كابل...' : lang === 'en' ? 'Passcode 1234, SIM removed, accessories...' : "Ex: Code 1234, carte SIM retirée, câble laissé avec l'appareil..."}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {t('cancel')}
            </button>
            <button type="submit" className="btn btn-primary">
              {isEditing ? t('saveChanges') : t('newRepair')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
