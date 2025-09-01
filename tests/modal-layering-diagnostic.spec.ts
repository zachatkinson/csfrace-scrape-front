import { test, expect } from '@playwright/test';

test.describe('Settings Modal Layering Diagnostic', () => {
  test('should diagnose modal z-index and positioning', async ({ page }) => {
    // Navigate to homepage
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(1000); // Allow page to fully load

    // First, let's check the initial state - modal should be hidden
    console.log('\n=== INITIAL STATE DIAGNOSTIC ===');
    
    // Check header z-index (select the main navigation header)
    const header = page.locator('header').first();
    const headerStyles = await header.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        position: computed.position,
        zIndex: computed.zIndex,
        top: computed.top,
        left: computed.left,
        right: computed.right
      };
    });
    console.log('Header styles:', headerStyles);

    // Check settings panel initial state
    const settingsPanel = page.locator('#settings-panel');
    const panelInitialStyles = await settingsPanel.evaluate(el => {
      const computed = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        position: computed.position,
        zIndex: computed.zIndex,
        top: computed.top,
        left: computed.left,
        right: computed.right,
        transform: computed.transform,
        visibility: computed.visibility,
        opacity: computed.opacity,
        boundingRect: {
          top: rect.top,
          bottom: rect.bottom,
          left: rect.left,
          right: rect.right
        }
      };
    });
    console.log('Settings Panel Initial styles:', panelInitialStyles);

    // Check settings toggle button
    const settingsToggle = page.locator('#settings-toggle');
    await expect(settingsToggle).toBeVisible();
    
    const toggleStyles = await settingsToggle.evaluate(el => {
      const computed = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        position: computed.position,
        zIndex: computed.zIndex,
        boundingRect: {
          top: rect.top,
          bottom: rect.bottom,
          left: rect.left,
          right: rect.right
        }
      };
    });
    console.log('Settings Toggle styles:', toggleStyles);

    console.log('\n=== OPENING SETTINGS MODAL ===');
    
    // Click settings button
    await settingsToggle.click();
    await page.waitForTimeout(500); // Allow animation to complete

    // Check settings panel after opening
    const panelOpenStyles = await settingsPanel.evaluate(el => {
      const computed = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        position: computed.position,
        zIndex: computed.zIndex,
        top: computed.top,
        left: computed.left,
        right: computed.right,
        transform: computed.transform,
        visibility: computed.visibility,
        opacity: computed.opacity,
        boundingRect: {
          top: rect.top,
          bottom: rect.bottom,
          left: rect.left,
          right: rect.right
        },
        hasTranslateYZero: computed.transform.includes('translateY(0px)')
      };
    });
    console.log('Settings Panel Open styles:', panelOpenStyles);

    // Check if panel is covering header
    const headerRect = await header.boundingBox();
    const panelRect = await settingsPanel.boundingBox();
    
    console.log('\n=== OVERLAP ANALYSIS ===');
    console.log('Header bounding box:', headerRect);
    console.log('Panel bounding box:', panelRect);

    if (headerRect && panelRect) {
      const overlap = {
        horizontal: panelRect.x < headerRect.x + headerRect.width && 
                   panelRect.x + panelRect.width > headerRect.x,
        vertical: panelRect.y < headerRect.y + headerRect.height && 
                 panelRect.y + panelRect.height > headerRect.y,
        headerBottom: headerRect.y + headerRect.height,
        panelTop: panelRect.y
      };
      console.log('Overlap analysis:', overlap);
      
      if (overlap.horizontal && overlap.vertical) {
        console.log('🚨 ISSUE DETECTED: Panel is overlapping with header');
        console.log(`Header bottom: ${overlap.headerBottom}, Panel top: ${overlap.panelTop}`);
        
        if (overlap.panelTop < overlap.headerBottom) {
          console.log('❌ Panel is positioned above header bottom - this is the issue!');
        }
      } else {
        console.log('✅ No overlap detected');
      }
    }

    // Check all z-index values in the document
    console.log('\n=== Z-INDEX ANALYSIS ===');
    const zIndexAnalysis = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      const zIndexElements = elements
        .map(el => {
          const computed = window.getComputedStyle(el);
          const zIndex = computed.zIndex;
          if (zIndex !== 'auto' && zIndex !== '0') {
            return {
              element: el.tagName + (el.id ? `#${el.id}` : '') + (el.className ? `.${el.className.split(' ')[0]}` : ''),
              zIndex: parseInt(zIndex),
              position: computed.position
            };
          }
          return null;
        })
        .filter(Boolean)
        .sort((a, b) => b.zIndex - a.zIndex);
      
      return zIndexElements;
    });
    
    console.log('Z-index hierarchy (highest to lowest):', zIndexAnalysis);

    // Take a screenshot for visual inspection
    await page.screenshot({ 
      path: 'tests/screenshots/modal-layering-diagnostic.png',
      fullPage: true 
    });
    console.log('\n📸 Screenshot saved to tests/screenshots/modal-layering-diagnostic.png');

    // Check if settings button is still clickable (covered by modal)
    console.log('\n=== INTERACTIVITY TEST ===');
    try {
      await settingsToggle.click({ timeout: 1000 });
      console.log('✅ Settings button is still clickable');
    } catch (error) {
      console.log('❌ Settings button is not clickable - likely covered by modal');
      console.log('Error:', error.message);
    }

    // Try to close modal and verify it closes properly
    console.log('\n=== MODAL CLOSE TEST ===');
    const closeButton = page.locator('#settings-close');
    await closeButton.click();
    await page.waitForTimeout(500);

    const panelClosedStyles = await settingsPanel.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        transform: computed.transform,
        hasTranslateYNegative: computed.transform.includes('-')
      };
    });
    console.log('Settings Panel Closed styles:', panelClosedStyles);
  });
});