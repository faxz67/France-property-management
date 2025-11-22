import React, { useState, useEffect } from 'react';
import { Bell, AlertCircle, Clock, CheckCircle, X, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../api';

interface Notification {
  id: string;
  type: 'overdue' | 'upcoming' | 'info' | 'success';
  title: string;
  message: string;
  action?: {
    section: string;
    id?: number;
  };
  timestamp: Date;
  read: boolean;
  priority?: 'high' | 'medium' | 'low';
  category?: 'bills' | 'leases' | 'payments' | 'tenants' | 'system';
  amount?: number;
  daysOverdue?: number;
  daysUntilDue?: number;
}

const NotificationsCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [previousNotifications, setPreviousNotifications] = useState<Set<string>>(new Set());

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      
      // Request permission if not already granted or denied
      if (Notification.permission === 'default') {
        Notification.requestPermission().then((permission) => {
          setNotificationPermission(permission);
          if (permission === 'granted') {
            console.log('✅ Notifications push activées');
          }
        });
      }
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Rafraîchir les notifications toutes les 2 minutes pour plus de réactivité
    const interval = setInterval(fetchNotifications, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // Récupérer les factures en retard et à venir
      const [billsRes, tenantsRes] = await Promise.all([
        api.listBills({ limit: 100 }),
        api.listTenants()
      ]);

      const bills = billsRes?.data?.data?.bills || [];
      const tenants = tenantsRes?.data?.data || [];

      const newNotifications: Notification[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Factures en retard
      const overdueBills = bills.filter((bill: any) => {
        if (bill.status === 'PAID') return false;
        if (!bill.due_date) return false;
        const dueDate = new Date(bill.due_date);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < today;
      });

      overdueBills.forEach((bill: any) => {
        const dueDate = new Date(bill.due_date);
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        const amount = bill.total_amount || bill.amount || 0;
        
        // Déterminer la priorité basée sur le nombre de jours de retard et le montant
        let priority: 'high' | 'medium' | 'low' = 'medium';
        if (daysOverdue > 30 || amount > 1000) {
          priority = 'high';
        } else if (daysOverdue > 7 || amount > 500) {
          priority = 'medium';
        } else {
          priority = 'low';
        }
        
        newNotifications.push({
          id: `overdue-${bill.id}`,
          type: 'overdue',
          title: daysOverdue > 30 ? '⚠️ Facture Très en Retard' : 'Facture en Retard',
          message: `Facture de €${amount.toFixed(2)} pour ${bill.tenant?.name || 'Locataire'} - ${daysOverdue} jour(s) de retard`,
          action: {
            section: 'payments',
            id: bill.id
          },
          timestamp: dueDate,
          read: false,
          priority,
          category: 'bills',
          amount,
          daysOverdue
        });
      });

      // Factures à venir (dans les 3 prochains jours)
      const upcomingBills = bills.filter((bill: any) => {
        if (bill.status === 'PAID') return false;
        if (!bill.due_date) return false;
        const dueDate = new Date(bill.due_date);
        dueDate.setHours(0, 0, 0, 0);
        const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilDue >= 0 && daysUntilDue <= 3;
      });

      upcomingBills.forEach((bill: any) => {
        const dueDate = new Date(bill.due_date);
        const daysUntilDue = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const amount = bill.total_amount || bill.amount || 0;
        
        // Priorité basée sur la proximité de l'échéance
        const priority: 'high' | 'medium' | 'low' = daysUntilDue === 0 ? 'high' : daysUntilDue === 1 ? 'medium' : 'low';
        
        newNotifications.push({
          id: `upcoming-${bill.id}`,
          type: 'upcoming',
          title: daysUntilDue === 0 ? '🔴 Échéance Aujourd\'hui' : daysUntilDue === 1 ? '⚠️ Échéance Demain' : 'Échéance Proche',
          message: `Facture de €${amount.toFixed(2)} pour ${bill.tenant?.name || 'Locataire'} - ${daysUntilDue === 0 ? "Aujourd'hui" : `Dans ${daysUntilDue} jour(s)`}`,
          action: {
            section: 'payments',
            id: bill.id
          },
          timestamp: dueDate,
          read: false,
          priority,
          category: 'bills',
          amount,
          daysUntilDue
        });
      });

      // Contrats qui expirent bientôt (dans les 30 prochains jours)
      tenants.forEach((tenant: any) => {
        const leaseEnd = tenant.lease_end || tenant.lease_end_date;
        if (leaseEnd) {
          const endDate = new Date(leaseEnd);
          endDate.setHours(0, 0, 0, 0);
          const daysUntilExpiry = Math.floor((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntilExpiry >= 0 && daysUntilExpiry <= 30) {
            // Priorité basée sur la proximité de l'expiration
            const priority: 'high' | 'medium' | 'low' = daysUntilExpiry <= 7 ? 'high' : daysUntilExpiry <= 15 ? 'medium' : 'low';
            
            newNotifications.push({
              id: `lease-expiry-${tenant.id}`,
              type: daysUntilExpiry <= 7 ? 'upcoming' : 'info',
              title: daysUntilExpiry === 0 ? '🔴 Contrat Expire Aujourd\'hui' : daysUntilExpiry <= 7 ? '⚠️ Contrat Expire Bientôt' : 'Contrat qui Expire',
              message: `Le contrat de ${tenant.name || tenant.fullName || 'Locataire'} expire ${daysUntilExpiry === 0 ? "aujourd'hui" : `dans ${daysUntilExpiry} jour(s)`}`,
              action: {
                section: 'tunnet',
                id: tenant.id
              },
              timestamp: endDate,
              read: false,
              priority,
              category: 'leases',
              daysUntilDue: daysUntilExpiry
            });
          }
        }
      });

      // Trier par priorité puis par date (plus importantes et récentes en premier)
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      newNotifications.sort((a, b) => {
        const aPriority = priorityOrder[a.priority || 'low'];
        const bPriority = priorityOrder[b.priority || 'low'];
        if (aPriority !== bPriority) {
          return bPriority - aPriority; // Priorité décroissante
        }
        return b.timestamp.getTime() - a.timestamp.getTime(); // Date décroissante
      });

      // Détecter les nouvelles notifications pour les push notifications
      const newNotificationIds = new Set(newNotifications.map(n => n.id));
      const newlyAdded = newNotifications.filter(n => !previousNotifications.has(n.id));
      
      // Mettre à jour les notifications précédentes
      setPreviousNotifications(newNotificationIds);

      // Envoyer des push notifications pour les nouvelles notifications importantes
      if (notificationPermission === 'granted' && newlyAdded.length > 0) {
        // Grouper les notifications pour éviter le spam
        const highPriorityNotifications = newlyAdded.filter(n => n.priority === 'high');
        const mediumPriorityNotifications = newlyAdded.filter(n => n.priority === 'medium' && (n.type === 'overdue' || n.daysUntilDue === 0));
        
        // Envoyer les notifications haute priorité immédiatement
        highPriorityNotifications.forEach((notification) => {
          showBrowserNotification(notification);
        });
        
        // Pour les notifications moyenne priorité, envoyer seulement les plus urgentes
        if (mediumPriorityNotifications.length > 0) {
          // Limiter à 3 notifications pour éviter le spam
          mediumPriorityNotifications.slice(0, 3).forEach((notification) => {
            showBrowserNotification(notification);
          });
        }
        
        // Si beaucoup de notifications, envoyer un résumé
        if (newlyAdded.length > 5) {
          const overdueCount = newlyAdded.filter(n => n.type === 'overdue').length;
          const upcomingCount = newlyAdded.filter(n => n.type === 'upcoming').length;
          
          if (overdueCount > 0 || upcomingCount > 0) {
            setTimeout(() => {
              showBrowserNotification({
                id: 'summary',
                type: 'info',
                title: 'Résumé des Notifications',
                message: `${overdueCount > 0 ? `${overdueCount} facture(s) en retard. ` : ''}${upcomingCount > 0 ? `${upcomingCount} échéance(s) proche(s).` : ''}`,
                timestamp: new Date(),
                read: false,
                priority: 'medium',
                category: 'system'
              });
            }, 2000);
          }
        }
      }

      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      setUnreadCount(updated.filter(n => !n.read).length);
      return updated;
    });
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.action) {
      // Naviguer vers la section appropriée
      const event = new CustomEvent('navigate-to-section', {
        detail: {
          section: notification.action.section,
          billId: notification.action.id,
          tenantId: notification.action.id
        }
      });
      window.dispatchEvent(event);
      setIsOpen(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'overdue':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'upcoming':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'info':
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return "Hier";
    if (days < 7) return `Il y a ${days} jours`;
    return date.toLocaleDateString('fr-FR');
  };

  const showBrowserNotification = (notification: Notification) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const icon = notification.type === 'overdue' 
      ? '/icon-error.png' 
      : notification.type === 'upcoming'
      ? '/icon-warning.png'
      : '/icon-info.png';

    const notificationOptions: NotificationOptions = {
      body: notification.message,
      icon: icon,
      badge: '/icon-badge.png',
      tag: notification.id, // Évite les doublons
      requireInteraction: notification.type === 'overdue', // Reste visible pour les factures en retard
      silent: false,
      data: {
        notificationId: notification.id,
        section: notification.action?.section,
        id: notification.action?.id
      }
    };

    const browserNotification = new Notification(notification.title, notificationOptions);

    // Gérer le clic sur la notification
    browserNotification.onclick = () => {
      window.focus();
      if (notification.action) {
        const event = new CustomEvent('navigate-to-section', {
          detail: {
            section: notification.action.section,
            billId: notification.action.id,
            tenantId: notification.action.id
          }
        });
        window.dispatchEvent(event);
      }
      browserNotification.close();
    };

    // Fermer automatiquement après 5 secondes (sauf pour les factures en retard)
    if (notification.type !== 'overdue') {
      setTimeout(() => {
        browserNotification.close();
      }, 5000);
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('Votre navigateur ne supporte pas les notifications');
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    
    if (permission === 'granted') {
      // Envoyer une notification de test
      new Notification('Notifications activées', {
        body: 'Vous recevrez des alertes pour les factures en retard et les échéances importantes.',
        icon: '/icon-success.png'
      });
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-medium rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {/* Notification Settings */}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                {unreadCount > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAllAsRead();
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50"
                  >
                    Tout marquer lu
                  </button>
                )}
                {notificationPermission !== 'granted' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      requestNotificationPermission();
                    }}
                    className="text-xs text-green-600 hover:text-green-700 font-medium px-2 py-1 rounded hover:bg-green-50 flex items-center gap-1"
                    title="Activer les notifications push"
                  >
                    <Bell className="w-3 h-3" />
                    Activer les notifications
                  </button>
                )}
                {notificationPermission === 'granted' && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Notifications activées
                  </span>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1" style={{ maxHeight: '500px' }}>
              {loading ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mx-auto mb-2"></div>
                  <p className="text-sm">Chargement...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm font-medium">Aucune notification</p>
                  <p className="text-xs text-gray-400 mt-1">Vous serez notifié des événements importants</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors border-l-4 ${
                        notification.read ? 'opacity-70 bg-gray-50' : 'bg-white'
                      } ${
                        notification.type === 'overdue' ? 'border-l-red-500' :
                        notification.type === 'upcoming' ? 'border-l-yellow-500' :
                        notification.type === 'info' ? 'border-l-blue-500' :
                        'border-l-green-500'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="text-sm font-semibold text-gray-900 leading-tight">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2 leading-relaxed">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatTime(notification.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    fetchNotifications();
                  }}
                  className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium py-2 rounded hover:bg-blue-50 transition-colors"
                >
                  Actualiser les notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationsCenter;

