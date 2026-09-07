import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Service } from '../../../types';
import { 
  fetchAllServicesAdmin, 
  deleteService, 
  duplicateService, 
  toggleServiceStatus, 
  reorderServices 
} from '../../../services/servicesService';
import { AdminServiceList } from './AdminServiceList';
import { AdminServiceEditor } from './AdminServiceEditor';

interface AdminServicesSectionProps {
  currentUser: User | null;
}

export function AdminServicesSection({ currentUser }: AdminServicesSectionProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list');
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const loadServices = async () => {
    setLoading(true);
    try {
      const items = await fetchAllServicesAdmin();
      setServices(items);
    } catch (err) {
      console.error('Failed to load services for admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleNewService = () => {
    setSelectedService(null);
    setViewMode('editor');
  };

  const handleEditService = (service: Service) => {
    setSelectedService(service);
    setViewMode('editor');
  };

  const handleDeleteService = async (serviceId: string) => {
    await deleteService(serviceId);
    setServices(prev => prev.filter(s => s.id !== serviceId));
  };

  const handleDuplicateService = async (service: Service) => {
    await duplicateService(service);
    await loadServices();
  };

  const handleToggleStatus = async (service: Service) => {
    const newStatus = await toggleServiceStatus(service);
    setServices(prev => prev.map(s => {
      if (s.id === service.id) {
        return { ...s, status: newStatus };
      }
      return s;
    }));
  };

  const handleReorder = async (reordered: Service[]) => {
    setServices(reordered);
    const ids = reordered.map(s => s.id);
    await reorderServices(ids);
  };

  const handleServiceSaved = (savedService: Service) => {
    setServices(prev => {
      const exists = prev.some(s => s.id === savedService.id);
      if (exists) {
        return prev.map(s => s.id === savedService.id ? savedService : s);
      } else {
        return [...prev, savedService];
      }
    });
    setViewMode('list');
    setSelectedService(null);
  };

  if (viewMode === 'editor') {
    return (
      <AdminServiceEditor
        service={selectedService}
        onBack={() => {
          setViewMode('list');
          setSelectedService(null);
        }}
        onSaved={handleServiceSaved}
      />
    );
  }

  return (
    <AdminServiceList
      services={services}
      loading={loading}
      onNewService={handleNewService}
      onEditService={handleEditService}
      onDeleteService={handleDeleteService}
      onDuplicateService={handleDuplicateService}
      onToggleStatus={handleToggleStatus}
      onReorder={handleReorder}
    />
  );
}
