/**
 * Dependency Injection Container
 * SOLID: Dependency Inversion Principle - Central service registry
 * Manages service lifecycle and provides dependency injection
 */

import type { 
  IServiceContainer,
  IServiceRegistry,
  IApiService,
  IAuthService,
  IStorageService,
  ICacheService,
  IHttpService,
  INotificationService,
  ServiceContainerConfig
} from '../interfaces/services.ts';

// =============================================================================
// SERVICE REGISTRY IMPLEMENTATION
// =============================================================================

interface ServiceDefinition<T = unknown> {
  factory: () => T;
  singleton: boolean;
  instance?: T;
}

/**
 * Service Registry Implementation
 * Manages service registration and resolution
 */
export class ServiceRegistry implements IServiceRegistry {
  private services = new Map<string, ServiceDefinition>();
  private onRegisterCallbacks: Array<(name: string) => void> = [];
  private onUnregisterCallbacks: Array<(name: string) => void> = [];

  register<T>(name: string, factory: () => T): void {
    this.services.set(name, { factory, singleton: false });
    this.notifyOnRegister(name);
  }

  registerSingleton<T>(name: string, factory: () => T): void {
    this.services.set(name, { factory, singleton: true });
    this.notifyOnRegister(name);
  }

  registerInstance<T>(name: string, instance: T): void {
    this.services.set(name, { 
      factory: () => instance, 
      singleton: true, 
      instance 
    });
    this.notifyOnRegister(name);
  }

  resolve<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service '${name}' is not registered. Available services: ${Array.from(this.services.keys()).join(', ')}`);
    }

    if (service.singleton) {
      if (!service.instance) {
        service.instance = service.factory();
      }
      return service.instance as T;
    }

    return service.factory() as T;
  }

  resolveOptional<T>(name: string): T | null {
    try {
      return this.resolve<T>(name);
    } catch {
      return null;
    }
  }

  unregister(name: string): void {
    const existed = this.services.delete(name);
    if (existed) {
      this.notifyOnUnregister(name);
    }
  }

  isRegistered(name: string): boolean {
    return this.services.has(name);
  }

  clear(): void {
    const serviceNames = Array.from(this.services.keys());
    this.services.clear();
    serviceNames.forEach(name => this.notifyOnUnregister(name));
  }

  onRegister(callback: (name: string) => void): () => void {
    this.onRegisterCallbacks.push(callback);
    return () => {
      const index = this.onRegisterCallbacks.indexOf(callback);
      if (index > -1) {
        this.onRegisterCallbacks.splice(index, 1);
      }
    };
  }

  onUnregister(callback: (name: string) => void): () => void {
    this.onUnregisterCallbacks.push(callback);
    return () => {
      const index = this.onUnregisterCallbacks.indexOf(callback);
      if (index > -1) {
        this.onUnregisterCallbacks.splice(index, 1);
      }
    };
  }

  private notifyOnRegister(name: string): void {
    this.onRegisterCallbacks.forEach(callback => {
      try {
        callback(name);
      } catch (error) {
        console.error(`Error in onRegister callback for service '${name}':`, error);
      }
    });
  }

  private notifyOnUnregister(name: string): void {
    this.onUnregisterCallbacks.forEach(callback => {
      try {
        callback(name);
      } catch (error) {
        console.error(`Error in onUnregister callback for service '${name}':`, error);
      }
    });
  }

  // Debug methods
  getRegisteredServices(): string[] {
    return Array.from(this.services.keys());
  }

  getServiceInfo(name: string): { singleton: boolean; hasInstance: boolean } | null {
    const service = this.services.get(name);
    if (!service) return null;
    
    return {
      singleton: service.singleton,
      hasInstance: !!service.instance,
    };
  }
}

// =============================================================================
// SERVICE CONTAINER IMPLEMENTATION
// =============================================================================

/**
 * Service Container Implementation
 * Main dependency injection container
 */
export class ServiceContainer implements IServiceContainer {
  private registry: ServiceRegistry;
  private config: ServiceContainerConfig = {};
  private initialized = false;

  constructor() {
    this.registry = new ServiceRegistry();
    this.setupDefaultServices();
  }

  // =============================================================================
  // SERVICE ACCESSORS
  // =============================================================================

  get api(): IApiService {
    return this.registry.resolve<IApiService>('api');
  }

  get auth(): IAuthService {
    return this.registry.resolve<IAuthService>('auth');
  }

  get storage(): IStorageService {
    return this.registry.resolve<IStorageService>('storage');
  }

  get cache(): ICacheService {
    return this.registry.resolve<ICacheService>('cache');
  }

  get http(): IHttpService {
    return this.registry.resolve<IHttpService>('http');
  }

  get notifications(): INotificationService {
    return this.registry.resolve<INotificationService>('notifications');
  }

  // =============================================================================
  // CONTAINER MANAGEMENT
  // =============================================================================

  configure(config: ServiceContainerConfig): void {
    this.config = { ...this.config, ...config };
    
    if (this.initialized) {
      this.reconfigureServices();
    }
  }

  reset(): void {
    this.registry.clear();
    this.config = {};
    this.initialized = false;
    this.setupDefaultServices();
  }

  dispose(): void {
    // Dispose of any services that implement IDisposable
    const disposableServices = ['auth', 'cache', 'notifications'];
    
    for (const serviceName of disposableServices) {
      try {
        const service = this.registry.resolveOptional<{ dispose?: () => void }>(serviceName);
        if (service?.dispose) {
          service.dispose();
        }
      } catch (error) {
        console.error(`Error disposing service '${serviceName}':`, error);
      }
    }

    this.registry.clear();
    this.initialized = false;
  }

  // =============================================================================
  // SERVICE REGISTRATION
  // =============================================================================

  /**
   * Register a custom service implementation
   */
  registerService<T>(name: string, factory: () => T, singleton = true): void {
    if (singleton) {
      this.registry.registerSingleton(name, factory);
    } else {
      this.registry.register(name, factory);
    }
  }

  /**
   * Register a service instance
   */
  registerServiceInstance<T>(name: string, instance: T): void {
    this.registry.registerInstance(name, instance);
  }

  /**
   * Get the internal registry for advanced usage
   */
  getRegistry(): IServiceRegistry {
    return this.registry;
  }

  // =============================================================================
  // INITIALIZATION AND SETUP
  // =============================================================================

  private async setupDefaultServices(): Promise<void> {
    // Import service implementations lazily to avoid circular dependencies
    const [
      { RestApiService },
      { CustomAuthService },
      { BrowserStorageService },
      { MemoryCacheService },
      { AxiosHttpService },
      { ToastNotificationService }
    ] = await Promise.all([
      import('./implementations/RestApiService.ts'),
      import('./implementations/CustomAuthService.ts'),
      import('./implementations/BrowserStorageService.ts'),
      import('./implementations/MemoryCacheService.ts'),
      import('./implementations/AxiosHttpService.ts'),
      import('./implementations/ToastNotificationService.ts'),
    ]);

    // Register default implementations
    this.registry.registerSingleton('http', () => new AxiosHttpService(this.config.api || {}));
    this.registry.registerSingleton('storage', () => new BrowserStorageService(this.config.storage || {}));
    this.registry.registerSingleton('cache', () => new MemoryCacheService(this.config.cache || {}));
    this.registry.registerSingleton('notifications', () => new ToastNotificationService(this.config.notifications || {}));
    
    // API service depends on HTTP service
    this.registry.registerSingleton('api', () => new RestApiService(this.http, this.config.api || {}));
    
    // Auth service depends on HTTP and Storage services  
    this.registry.registerSingleton('auth', () => new CustomAuthService(
      this.http, 
      this.storage, 
      this.config.auth || {}
    ));

    this.initialized = true;
  }

  private reconfigureServices(): void {
    // Recreate services that need new configuration
    const servicesToRecreate = ['api', 'auth', 'storage', 'cache', 'http', 'notifications'];
    
    for (const serviceName of servicesToRecreate) {
      this.registry.unregister(serviceName);
    }
    
    this.setupDefaultServices();
  }

  // =============================================================================
  // DEBUGGING AND UTILITIES
  // =============================================================================

  /**
   * Get information about all registered services
   */
  getServiceInfo(): Record<string, { singleton: boolean; hasInstance: boolean }> {
    const services = this.registry.getRegisteredServices();
    const info: Record<string, { singleton: boolean; hasInstance: boolean }> = {};
    
    for (const serviceName of services) {
      const serviceInfo = this.registry.getServiceInfo(serviceName);
      if (serviceInfo) {
        info[serviceName] = serviceInfo;
      }
    }
    
    return info;
  }

  /**
   * Check if the container is properly configured
   */
  isHealthy(): boolean {
    const requiredServices = ['api', 'auth', 'storage', 'cache', 'http', 'notifications'];
    
    return requiredServices.every(serviceName => {
      try {
        this.registry.resolve(serviceName);
        return true;
      } catch {
        return false;
      }
    });
  }

  /**
   * Get a health report of the container
   */
  getHealthReport(): {
    healthy: boolean;
    services: Record<string, { registered: boolean; resolvable: boolean; error?: string }>;
  } {
    const services = ['api', 'auth', 'storage', 'cache', 'http', 'notifications'];
    const report: Record<string, { registered: boolean; resolvable: boolean; error?: string }> = {};
    
    for (const serviceName of services) {
      const registered = this.registry.isRegistered(serviceName);
      let resolvable = false;
      let error: string | undefined;
      
      if (registered) {
        try {
          this.registry.resolve(serviceName);
          resolvable = true;
        } catch (e) {
          error = e instanceof Error ? e.message : 'Unknown error';
        }
      }
      
      report[serviceName] = { registered, resolvable, error };
    }
    
    const healthy = Object.values(report).every(status => status.registered && status.resolvable);
    
    return { healthy, services: report };
  }
}

// =============================================================================
// GLOBAL CONTAINER INSTANCE
// =============================================================================

// Create global singleton instance
let globalContainer: ServiceContainer | null = null;

/**
 * Get the global service container instance
 */
export function getServiceContainer(): ServiceContainer {
  if (!globalContainer) {
    globalContainer = new ServiceContainer();
  }
  return globalContainer;
}

/**
 * Set a custom global service container (for testing)
 */
export function setServiceContainer(container: ServiceContainer): void {
  if (globalContainer) {
    globalContainer.dispose();
  }
  globalContainer = container;
}

/**
 * Reset the global service container
 */
export function resetServiceContainer(): void {
  if (globalContainer) {
    globalContainer.dispose();
    globalContainer = null;
  }
}

// =============================================================================
// CONVENIENCE HOOKS AND FUNCTIONS
// =============================================================================

/**
 * Get a specific service from the global container
 */
export function useService<T>(serviceName: string): T {
  return getServiceContainer().getRegistry().resolve<T>(serviceName);
}

/**
 * Get multiple services from the global container
 */
export function useServices<T extends Record<string, unknown>>(
  serviceNames: Array<keyof T>
): T {
  const container = getServiceContainer();
  const services = {} as T;
  
  for (const serviceName of serviceNames) {
    services[serviceName] = container.getRegistry().resolve(serviceName as string) as T[keyof T];
  }
  
  return services;
}

/**
 * React hook for accessing services with proper dependency tracking
 */
export function useServiceContainer(): IServiceContainer {
  return getServiceContainer();
}

export default ServiceContainer;