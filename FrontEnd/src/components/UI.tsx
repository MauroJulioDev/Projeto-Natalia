import React from 'react';

interface CardProps { children: React.ReactNode; className?: string; }
interface ButtonProps { 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary' | 'success' | 'outline' | 'danger'; 
  type?: 'button' | 'submit' | 'reset'; 
  className?: string; 
  disabled?: boolean; 
}

export const Card = ({ children, className = "" }: CardProps) => (
  <div className={`bg-white rounded-lg shadow-md overflow-hidden border border-gray-100 ${className}`}>
    {children}
  </div>
);

export const Button = ({ children, onClick, variant = "primary", type = "button", className = "", disabled = false }: ButtonProps) => {
  const variants: any = {
    primary: "bg-pink-600 text-white hover:bg-pink-700 shadow-pink-200",
    secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200",
    success: "bg-green-600 text-white hover:bg-green-700 shadow-green-200",
    outline: "border-2 border-pink-600 text-pink-600 hover:bg-pink-50",
    danger: "bg-red-600 text-white hover:bg-red-700 shadow-red-200"
  };
  return (
    <button 
      type={type} 
      onClick={onClick} 
      disabled={disabled} 
      className={`px-4 py-2 rounded font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};