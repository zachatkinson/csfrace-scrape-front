import { test, expect } from '@playwright/test';

test('debug details DOM structure', async ({ page }) => {
  console.log('🔍 Debugging the Details button DOM structure...');
  
  await page.goto('/');
  await page.waitForTimeout(3000);
  
  // Check if Details button exists
  const detailsButton = page.locator('button:has-text("Details")').first();
  const buttonCount = await detailsButton.count();
  console.log(`Found ${buttonCount} Details buttons`);
  
  if (buttonCount > 0) {
    // Inspect the DOM structure around the Details button
    const buttonInfo = await page.evaluate(() => {
      const button = document.querySelector('button:has-text("Details"), button span:has-text("Details")') as HTMLElement;
      if (!button) return { found: false };
      
      console.log('Button element:', button);
      console.log('Button onclick:', button.getAttribute('onclick'));
      console.log('Button parent:', button.parentElement);
      
      // Look for error-details class
      const errorDetails = document.querySelector('.error-details');
      console.log('Error details element:', errorDetails);
      
      // Look for any elements with style attributes that might be the details
      const elementsWithStyle = Array.from(document.querySelectorAll('[style*="max-height"]'));
      console.log('Elements with max-height styles:', elementsWithStyle);
      
      return {
        found: true,
        onclick: button.getAttribute('onclick'),
        hasErrorDetails: !!errorDetails,
        errorDetailsCount: document.querySelectorAll('.error-details').length,
        parentClasses: button.parentElement?.className || '',
        buttonClasses: button.className,
        styledElements: elementsWithStyle.length
      };
    });
    
    console.log('Button analysis:', JSON.stringify(buttonInfo, null, 2));
    
    // Try to click and see what happens in the DOM
    console.log('🖱️ Clicking button and monitoring DOM changes...');
    
    // Monitor DOM mutations
    await page.evaluate(() => {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes') {
            console.log('Attribute changed:', mutation.target, mutation.attributeName, (mutation.target as Element).getAttribute(mutation.attributeName));
          }
          if (mutation.type === 'childList') {
            console.log('Child list changed:', mutation.target);
          }
        });
      });
      
      observer.observe(document.body, {
        attributes: true,
        childList: true,
        subtree: true,
        attributeOldValue: true
      });
      
      // Store observer globally so we can disconnect it later
      (window as any).domObserver = observer;
    });
    
    // Click the button
    await detailsButton.click();
    await page.waitForTimeout(1000);
    
    // Check what changed
    const afterClickInfo = await page.evaluate(() => {
      // Disconnect observer
      if ((window as any).domObserver) {
        (window as any).domObserver.disconnect();
      }
      
      const errorDetails = document.querySelector('.error-details') as HTMLElement;
      const allErrorDetails = document.querySelectorAll('.error-details');
      
      return {
        errorDetailsFound: !!errorDetails,
        errorDetailsCount: allErrorDetails.length,
        errorDetailsVisible: errorDetails ? !errorDetails.classList.contains('hidden') : false,
        errorDetailsDisplay: errorDetails ? window.getComputedStyle(errorDetails).display : 'none',
        errorDetailsOpacity: errorDetails ? window.getComputedStyle(errorDetails).opacity : '0',
        errorDetailsMaxHeight: errorDetails ? window.getComputedStyle(errorDetails).maxHeight : '0px',
        errorDetailsClasses: errorDetails ? errorDetails.className : '',
        errorDetailsStyle: errorDetails ? errorDetails.getAttribute('style') : '',
      };
    });
    
    console.log('After click analysis:', JSON.stringify(afterClickInfo, null, 2));
    
    // Take a detailed screenshot
    await page.screenshot({ 
      path: 'test-results/debug-details-dom.png',
      fullPage: true 
    });
    
  } else {
    console.log('❌ No Details button found');
  }
});