/**
 * Contact Form Example
 * Demonstrates the unified form system in action
 * Shows how complex forms can be built with zero duplication
 */

import React from 'react';
import { 
  UnifiedFormBuilder, 
  Field, 
  CommonValidationSets,
  validationRules,
  type IUnifiedFormConfig 
} from '../unified';

interface ContactFormProps {
  onSubmit?: (data: ContactFormData) => Promise<void>;
  onCancel?: () => void;
  className?: string;
}

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  contactPreference: 'email' | 'phone' | 'any';
  newsletter: boolean;
  attachments?: FileList;
}

/**
 * Contact Form Configuration
 * Declarative form definition using the unified system
 */
const contactFormConfig: IUnifiedFormConfig = {
  id: 'contact-form',
  title: 'Contact Us',
  subtitle: 'We\'d love to hear from you. Send us a message and we\'ll respond as soon as possible.',
  validateOnBlur: true,
  validateOnChange: false,
  submitOnEnter: true,
  fields: [
    // Name field with validation
    Field.create('name', 'text')
      .label('Full Name')
      .placeholder('Enter your full name')
      .required()
      .validation(CommonValidationSets.text(2, 100))
      .autoComplete('name')
      .build(),

    // Email field with built-in validation
    Field.create('email', 'email')
      .label('Email Address')
      .placeholder('your.email@example.com')
      .required()
      .validation(CommonValidationSets.email())
      .autoComplete('email')
      .build(),

    // Phone field (optional)
    Field.create('phone', 'tel')
      .label('Phone Number')
      .placeholder('(555) 123-4567')
      .helpText('Optional - only if you prefer phone contact')
      .validation(CommonValidationSets.phone())
      .autoComplete('tel')
      .build(),

    // Subject field
    Field.create('subject', 'text')
      .label('Subject')
      .placeholder('What is this regarding?')
      .required()
      .validation(CommonValidationSets.text(5, 200))
      .build(),

    // Message textarea
    Field.create('message', 'textarea')
      .label('Message')
      .placeholder('Tell us more about your inquiry...')
      .required()
      .validation(CommonValidationSets.text(10, 2000))
      .build(),

    // Priority select
    Field.create('priority', 'select')
      .label('Priority Level')
      .defaultValue('medium')
      .options([
        { value: 'low', label: 'Low - General inquiry' },
        { value: 'medium', label: 'Medium - Need response soon' },
        { value: 'high', label: 'High - Urgent matter' }
      ])
      .build(),

    // Contact preference radio
    Field.create('contactPreference', 'radio')
      .label('Preferred Contact Method')
      .defaultValue('email')
      .options([
        { 
          value: 'email', 
          label: 'Email', 
          description: 'We\'ll respond via email' 
        },
        { 
          value: 'phone', 
          label: 'Phone', 
          description: 'We\'ll call you during business hours' 
        },
        { 
          value: 'any', 
          label: 'Either', 
          description: 'Use whichever method is most convenient' 
        }
      ])
      .build(),

    // File attachments
    Field.create('attachments', 'file')
      .label('Attachments (Optional)')
      .helpText('Upload any relevant files (max 5MB each)')
      .validation(
        CommonValidationSets.required()
          .addRule(validationRules.fileValidation({
            maxSize: 5 * 1024 * 1024, // 5MB
            maxFiles: 3,
            allowedTypes: ['image/', 'application/pdf', '.doc', '.docx']
          }))
      )
      .build(),

    // Newsletter subscription checkbox
    Field.create('newsletter', 'checkbox')
      .label('Subscribe to our newsletter for updates and tips')
      .defaultValue(false)
      .build(),
  ]
};

/**
 * Contact Form Component
 * Uses the unified form system for zero-boilerplate form creation
 */
export const ContactForm: React.FC<ContactFormProps> = ({
  onSubmit,
  onCancel,
  className = ''
}) => {
  const handleSubmit = async (data: Record<string, any>) => {
    const formData = data as ContactFormData;
    
    console.log('Contact form submitted:', formData);
    
    try {
      await onSubmit?.(formData);
      
      // Show success message or redirect
      alert('Thank you for your message! We\'ll get back to you soon.');
    } catch (error) {
      console.error('Failed to submit contact form:', error);
      alert('Sorry, there was an error sending your message. Please try again.');
    }
  };

  return (
    <div className={className}>
      <UnifiedFormBuilder
        {...contactFormConfig}
        onSubmit={handleSubmit}
        onCancel={onCancel}
        showCancel={!!onCancel}
        submitLabel="Send Message"
        cancelLabel="Cancel"
        className="max-w-2xl"
      />
    </div>
  );
};

export default ContactForm;