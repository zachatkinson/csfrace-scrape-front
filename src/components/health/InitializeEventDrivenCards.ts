// =============================================================================
// INITIALIZE EVENT-DRIVEN HEALTH CARDS
// Replaces DOM manipulation with React components that listen to events
// =============================================================================

import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { EventDrivenHealthCard } from './EventDrivenHealthCard.ts';
import { createContextLogger } from '../../utils/logger';

const logger = createContextLogger('InitializeEventDrivenCards');

export function initializeEventDrivenCards() {
  logger.info('Initializing event-driven health cards');

  // Card configurations
  const cardConfigs = [
    {
      serviceName: 'frontend' as const,
      domPrefix: 'frontend',
      title: 'Frontend Service',
      icon: '🌐',
      description: 'Astro frontend application',
      containerId: 'frontend-card-container'
    },
    {
      serviceName: 'backend' as const,
      domPrefix: 'backend',
      title: 'Backend Service',
      icon: '🔧',
      description: 'FastAPI backend service',
      containerId: 'backend-card-container'
    },
    {
      serviceName: 'database' as const,
      domPrefix: 'postgres',
      title: 'Database Service',
      icon: '🐘',
      description: 'PostgreSQL database',
      containerId: 'database-card-container'
    },
    {
      serviceName: 'cache' as const,
      domPrefix: 'redis',
      title: 'Cache Service',
      icon: '⚡',
      description: 'Redis cache service',
      containerId: 'cache-card-container'
    }
  ];

  // Initialize each card
  cardConfigs.forEach(config => {
    const container = document.getElementById(config.containerId);
    if (container) {
      logger.info('Initializing card', { serviceName: config.serviceName });

      const root = createRoot(container);
      root.render(createElement(EventDrivenHealthCard, {
        serviceName: config.serviceName,
        domPrefix: config.domPrefix,
        title: config.title,
        icon: config.icon,
        description: config.description
      }));

      logger.info('Card initialized', { serviceName: config.serviceName });
    } else {
      console.warn(`⚠️ Container not found for ${config.serviceName}: ${config.containerId}`);
    }
  });

  logger.info('Event-driven health cards initialization complete');
}

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEventDrivenCards);
  } else {
    initializeEventDrivenCards();
  }
}