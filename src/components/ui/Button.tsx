// src/components/ui/Button.tsx
import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors';
  
  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    outline: 'border border-gray-300 bg-transparent hover:bg-gray-100 text-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 dark:text-gray-300 dark:hover:bg-gray-800',
  };
  
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  const loadingStyles = isLoading ? 'opacity-70 cursor-not-allowed' : '';
  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : '';
  
  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${loadingStyles} ${disabledStyles} ${className}`;
  
  return (
    <button className={combinedClassName} disabled={disabled || isLoading} {...props}>
      {isLoading ? (
        <div className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </div>
      ) : (
        children
      )}
    </button>
  );
};

// src/components/ui/Card.tsx
import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title }) => {
  return (
    <div className={`bg-gray-800 rounded-lg shadow-lg overflow-hidden ${className}`}>
      {title && (
        <div className="border-b border-gray-700 px-6 py-4">
          <h3 className="text-lg font-medium text-white">{title}</h3>
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
};

// src/components/ui/Input.tsx
import React, { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="mb-4">
        {label && (
          <label htmlFor={props.id} className="block text-sm font-medium text-gray-300 mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-2 bg-gray-800 border ${
            error ? 'border-red-500' : 'border-gray-700'
          } rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
          {...props}
        />
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

// src/components/ui/Select.tsx
import React, { SelectHTMLAttributes, forwardRef } from 'react';

interface Option {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Option[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', ...props }, ref) => {
    return (
      <div className="mb-4">
        {label && (
          <label htmlFor={props.id} className="block text-sm font-medium text-gray-300 mb-1">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`w-full px-4 py-2 bg-gray-800 border ${
            error ? 'border-red-500' : 'border-gray-700'
          } rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

// src/components/ui/Textarea.tsx
import React, { TextareaHTMLAttributes, forwardRef } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="mb-4">
        {label && (
          <label htmlFor={props.id} className="block text-sm font-medium text-gray-300 mb-1">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`w-full px-4 py-2 bg-gray-800 border ${
            error ? 'border-red-500' : 'border-gray-700'
          } rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
          rows={5}
          {...props}
        />
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// src/components/ui/Badge.tsx
import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
}) => {
  const variantStyles = {
    default: 'bg-gray-600 text-gray-100',
    success: 'bg-green-600 text-green-100',
    warning: 'bg-yellow-600 text-yellow-100',
    danger: 'bg-red-600 text-red-100',
    info: 'bg-blue-600 text-blue-100',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

// src/components/layout/Sidebar.tsx
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  BriefcaseIcon, 
  UsersIcon, 
  DocumentTextIcon, 
  CalendarIcon, 
  CurrencyDollarIcon, 
  CogIcon 
} from 'react-icons/hi2';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Cases', href: '/cases', icon: BriefcaseIcon },
  { name: 'Parties', href: '/parties', icon: UsersIcon },
  { name: 'Documents', href: '/documents', icon: DocumentTextIcon },
  { name: 'Deadlines', href: '/deadlines', icon: CalendarIcon },
  { name: 'Financials', href: '/financials', icon: CurrencyDollarIcon },
  { name: 'Settings', href: '/settings', icon: CogIcon },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="h-full flex flex-col bg-gray-900 w-64 border-r border-gray-800">
      <div className="flex items-center h-16 px-4 border-b border-gray-800">
        <h1 className="text-white text-xl font-bold">LegalBeacon</h1>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className="space-y-1 px-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  isActive
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 ${
                    isActive ? 'text-white' : 'text-gray-400'
                  }`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

// src/components/layout/Header.tsx
import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  BellIcon, 
  UserCircleIcon 
} from 'react-icons/hi2';
import LogoutButton from '../auth/LogoutButton';

interface HeaderProps {
  title?: string;
}

export default function Header({ title = 'Dashboard' }: HeaderProps) {
  return (
    <header className="bg-gray-900 border-b border-gray-800 h-16">
      <div className="flex items-center justify-between h-full px-4">
        <h1 className="text-white text-xl font-semibold">{title}</h1>
        
        <div className="flex items-center space-x-4">
          <button className="text-gray-300 hover:text-white">
            <BellIcon className="h-6 w-6" />
          </button>
          
          <div className="relative">
            <button className="flex items-center text-gray-300 hover:text-white">
              <UserCircleIcon className="h-8 w-8" />
            </button>
          </div>
          
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}

// src/components/layout/MainLayout.tsx
import React, { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function MainLayout({ children, title }: MainLayoutProps) {
  return (
    <div className="h-screen flex overflow-hidden bg-gray-950 text-white">
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header title={title} />
        
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
