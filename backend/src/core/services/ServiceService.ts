import { Service, ServiceResult } from '../models/Service';
import 'colors';

export interface ServiceDTO {
    id: string;
    name: string;
    displayName: string;
    description?: string;
    iconUrl?: string;
    baseUrl?: string;
    authType: 'oauth2' | 'api_key' | 'basic' | 'none';
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export class ServiceService {
    /**
     * Get all active services
     */
    async getAllServices(): Promise<ServiceDTO[]> {
        const services = await Service.findAllActive();
        return services.map(this.mapToDTO);
    }

    /**
     * Get service by ID
     */
    async getServiceById(serviceId: string): Promise<ServiceDTO> {
        const service = await Service.findById(serviceId);

        if (!service)
            throw new Error('SERVICE_NOT_FOUND');
        if (!service.is_active)
            throw new Error('SERVICE_INACTIVE');
        return this.mapToDTO(service);
    }

    /**
     * Get service by name
     */
    async getServiceByName(serviceName: string): Promise<ServiceDTO> {
        const service = await Service.findByName(serviceName);

        if (!service)
            throw new Error('SERVICE_NOT_FOUND');
        if (!service.is_active)
            throw new Error('SERVICE_INACTIVE');
        return this.mapToDTO(service);
    }

    /**
     * Map database result to DTO (sans les informations sensibles)
     */
    private mapToDTO(service: ServiceResult): ServiceDTO {
        return {
            id: service.id,
            name: service.name,
            displayName: service.display_name,
            description: service.description,
            iconUrl: service.icon_url,
            baseUrl: service.base_url,
            authType: service.auth_type,
            isActive: service.is_active,
            createdAt: service.created_at,
            updatedAt: service.updated_at
        };
    }
}

export default ServiceService;
