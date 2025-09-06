import { test } from '@playwright/test';

test('simple debug details button', async ({ page }) => {
  console.log('🔍 Simple debug of Details button...');
  
  await page.goto('/');
  await page.waitForTimeout(3000);
  
  // Find Details button using simpler selector
  const buttonInfo = await page.evaluate(() => {
    // Look for buttons containing "Details" text
    const buttons = Array.from(document.querySelectorAll('button'));
    const detailsButton = buttons.find(btn => btn.textContent?.includes('Details'));
    
    if (detailsButton) {
      console.log('✅ Found Details button');
      console.log('Button text:', detailsButton.textContent);
      console.log('Button onclick:', detailsButton.getAttribute('onclick'));
      
      // Look for error-details elements
      const errorDetails = document.querySelector('.error-details');
      
      return {
        found: true,
        buttonText: detailsButton.textContent,
        hasOnClick: !!detailsButton.getAttribute('onclick'),
        errorDetailsExists: !!errorDetails,
        errorDetailsHidden: errorDetails?.classList.contains('hidden') || false,
      };
    }
    
    return { found: false };
  });
  
  console.log('Button info:', buttonInfo);
  
  if (buttonInfo.found) {
    // Try clicking using page.click with better selector
    const detailsButton = page.locator('button').filter({ hasText: 'Details' }).first();
    
    console.log('🖱️ Clicking Details button...');
    await detailsButton.click();
    
    await page.waitForTimeout(1000);
    
    // Check result
    const result = await page.evaluate(() => {
      const errorDetails = document.querySelector('.error-details') as HTMLElement;
      
      if (!errorDetails) {
        console.log('❌ No .error-details element found');
        return { success: false, reason: 'No error-details element' };
      }
      
      const isHidden = errorDetails.classList.contains('hidden');
      const display = window.getComputedStyle(errorDetails).display;
      const visibility = window.getComputedStyle(errorDetails).visibility;
      const opacity = window.getComputedStyle(errorDetails).opacity;
      const maxHeight = window.getComputedStyle(errorDetails).maxHeight;
      
      console.log('Error details state:', {
        isHidden,
        display,
        visibility, 
        opacity,
        maxHeight,
        classList: errorDetails.className,
        style: errorDetails.getAttribute('style')
      });
      
      return {
        success: !isHidden && display !== 'none' && opacity !== '0',
        isHidden,
        display,
        visibility,
        opacity,
        maxHeight,
        classList: errorDetails.className,
        style: errorDetails.getAttribute('style')
      };
    });
    
    console.log('Click result:', result);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'test-results/simple-debug-after-click.png',
      fullPage: true 
    });
    
  } else {
    console.log('❌ No Details button found on page');
    
    // Take screenshot to see what's there
    await page.screenshot({ 
      path: 'test-results/simple-debug-no-button.png',
      fullPage: true 
    });
  }
});