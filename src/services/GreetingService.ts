/**
 * Greeting Service - SOLID Architecture
 * Single Responsibility: Handle greeting message generation
 * Open/Closed: Extensible for new greeting types and periods
 * Interface Segregation: Clean greeting interface
 * Dependency Inversion: Uses existing timezone utility (DRY principle)
 */

import type { ILogger } from '../types/global.types';
import { uiLogger } from '../utils/logger';

export interface IGreetingService {
  getCurrentGreeting(): string;
  getGreetingForPeriod(period: string): string;
  getRandomGreeting(period: string): string;
}

export interface IGreetingConfig {
  [period: string]: string[];
}

class GreetingService implements IGreetingService {
  private readonly logger: ILogger;

  // Greeting messages configuration (Open/Closed Principle)
  private readonly greetingMessages: IGreetingConfig = {
    lateNight: [
      "🌙 Burning the midnight oil? Let's make magic ✨ happen!",
      "Night owl 🦉 mode activated! Time for some epic conversions!",
      "The best ideas come at night ⭐ - let's convert something amazing!",
      "Late night productivity! Ready to transform some content? 🔥",
      "Working while the world sleeps - let's create something special! 💫"
    ],
    earlyMorning: [
      "🌅 Rise and shine! Early bird gets the best conversions!",
      "Good morning, champion! Ready to conquer ☀️ WordPress today?",
      "Fresh start, fresh conversions! What's first on the list? 🎯",
      "Morning motivation 💪 activated! Let's transform some sites!",
      "New day, new possibilities! Time to convert with purpose! 🌱"
    ],
    lateMorning: [
      "Mid-morning energy ☕ boost! Let's tackle some conversions!",
      "🚀 Morning momentum building! Ready for conversion magic?",
      "Caffeine + conversions = perfect combination! ⚡",
      "Creative juices flowing! Time to transform WordPress art! 🎨",
      "Peak productivity 🔧 hours - let's make things happen!"
    ],
    earlyAfternoon: [
      "Post-lunch power! Let's digest some WordPress content! 🍕",
      "⚡ Afternoon energy surge! Ready to convert and conquer?",
      "Midday momentum! Time for some conversion excellence! 🎯",
      "Prime time 🚀 for productivity! What shall we transform?",
      "Bright ideas ahead! Let's illuminate 💡 some WordPress sites!"
    ],
    lateAfternoon: [
      "Golden hour productivity! Let's make these conversions shine! 🌇",
      "🔥 Afternoon finale! Time to finish strong with great conversions!",
      "Pre-evening energy! Ready for one more sprint? ⚡",
      "Creative afternoon 🎨 vibes! Let's craft something beautiful!",
      "Day's final push! Let's make these WordPress sites sparkle! 💪✨"
    ],
    earlyEvening: [
      "Evening inspiration strikes! Time for conversion magic! 🌆",
      "✨ Twilight productivity! Let's transform while the sun sets!",
      "Evening creativity! Ready to perform 🎭 conversion miracles?",
      "Perfect evening for some thoughtful WordPress transformations! 🌃",
      "Evening wisdom activated! Time for thoughtful transformations! 🔮"
    ]
  };

  private readonly fallbackGreeting = "Ready to convert something amazing today?";

  constructor() {
    this.logger = uiLogger;
  }

  /**
   * Get current hour using existing timezone utility (DRY principle)
   */
  private getCurrentHour(): number {
    return new Date().getHours();
  }

  /**
   * Determine time period based on hour
   */
  private getTimePeriod(hour: number): string {
    if (hour >= 0 && hour < 5) return 'lateNight';
    if (hour >= 5 && hour < 9) return 'earlyMorning';
    if (hour >= 9 && hour < 12) return 'lateMorning';
    if (hour >= 12 && hour < 15) return 'earlyAfternoon';
    if (hour >= 15 && hour < 18) return 'lateAfternoon';
    if (hour >= 18 && hour < 22) return 'earlyEvening';
    return 'lateNight';
  }

  getCurrentGreeting(): string {
    try {
      const currentHour = this.getCurrentHour();
      const period = this.getTimePeriod(currentHour);

      const greeting = this.getRandomGreeting(period);

      this.logger.info('Generated greeting', {
        period,
        hour: currentHour,
        greeting: greeting.substring(0, 50) + '...'
      });

      return greeting;
    } catch (error) {
      this.logger.error('Failed to get current greeting, using fallback', error as Error);
      return this.fallbackGreeting;
    }
  }

  getGreetingForPeriod(period: string): string {
    return this.getRandomGreeting(period);
  }

  getRandomGreeting(period: string): string {
    const messages = this.greetingMessages[period];
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      this.logger.warn('No messages found for period, using fallback', { period });
      return this.fallbackGreeting;
    }

    const randomIndex = Math.floor(Math.random() * messages.length);
    const selectedMessage = messages[randomIndex];
    
    if (!selectedMessage || typeof selectedMessage !== 'string') {
      this.logger.warn('Invalid message selected, using fallback', { period, randomIndex });
      return this.fallbackGreeting;
    }

    return selectedMessage;
  }

  /**
   * Add new greeting messages for a period (Open/Closed Principle)
   */
  addGreetingsForPeriod(period: string, messages: string[]): void {
    if (!this.greetingMessages[period]) {
      this.greetingMessages[period] = [];
    }
    
    this.greetingMessages[period].push(...messages);
    this.logger.info('Added new greetings for period', { period, count: messages.length });
  }

  /**
   * Get all available periods
   */
  getAvailablePeriods(): string[] {
    return Object.keys(this.greetingMessages);
  }

  /**
   * Get greeting count for a period
   */
  getGreetingCount(period: string): number {
    return this.greetingMessages[period]?.length || 0;
  }
}

export default GreetingService;