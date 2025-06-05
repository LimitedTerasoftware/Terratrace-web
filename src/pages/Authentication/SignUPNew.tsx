import React from 'react';
import AuthLayout from '../Authentication/auth/AuthLayout';
import SignupForm from '../Authentication/auth/SignupForm';

const Signup: React.FC = () => {
  return (
    <AuthLayout 
      title="Create an Account" 
      subtitle="Get started with Tricad today."
    >
      <SignupForm />
    </AuthLayout>
  );
};

export default Signup;