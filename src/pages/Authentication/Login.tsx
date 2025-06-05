import React from 'react';
import AuthLayout from '../Authentication/auth/AuthLayout';
import LoginForm from '../Authentication/auth/LoginForm';

const Login: React.FC = () => {
  return (
    <AuthLayout 
      title="Sign In" 
      subtitle="Welcome back! Please enter your details."
    >
      <LoginForm />
    </AuthLayout>
  );
};

export default Login;