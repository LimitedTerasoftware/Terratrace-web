import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

interface FormErrors {
  email?: string;
  password?: string;
}

const LoginForm: React.FC = () => {

  const BASEURL = import.meta.env.VITE_API_BASE;
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading,setLoading] = useState(false)

  const navigate = useNavigate();
    // Validation for email and password
    const validateForm = (): boolean => {
      const formErrors: FormErrors = {};
      if (!email) {
        formErrors.email = "Email is required.";
      } else if (!/\S+@\S+\.\S+/.test(email)) {
        formErrors.email = "Email is invalid.";
      }
  
      if (!password) {
        formErrors.password = "Password is required.";
      } else if (password.length < 6) {
        formErrors.password = "Password must be at least 6 characters.";
      }
  
      setErrors(formErrors);
      return Object.keys(formErrors).length === 0;
    };
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true)
    try {
      const response = await axios.post(`${BASEURL}/adminuser`, {
        email,
        password,
      });
      if (response.status === 200) {
        setLoading(false)
        // Save login success data to localStorage
        localStorage.setItem("userData", JSON.stringify(response.data.admin));
        localStorage.setItem("token", response.data.token); // Save token as well

        toast.success("Login successful!", {
          autoClose: 3000, 
        });

        // Redirect to /dashboard
        navigate("/dashboard");
      } else {
        setLoading(false)
        toast.error(response.data.message || "Invalid credentials.", {
          autoClose: 3000, // Correct property name
        });
      }
    } catch (error) {
      setLoading(false)
      
      toast.error("Something went wrong. Please try again later.", {
        autoClose: 3000, // Correct property name
      });
    }
  };
 return (
    <div className="space-y-6">
       <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-4">
          <Input
            label="Email"
            type="email"
            name="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            leftIcon={<Mail className="h-5 w-5 text-gray-400" />}
            required
            autoFocus
          />
          
          <Input
            label="Password"
            type="password"
            name="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            leftIcon={<Lock className="h-5 w-5 text-gray-400" />}
            required
          />
        </div>
        
        <Button
          type="submit"
          fullWidth
          isLoading={loading}
          rightIcon={<ArrowRight className="h-4 w-4" />}
          className="mt-8 group"
        >
          <span className="group-hover:mr-1 transition-all">Sign In</span>
        </Button>
      </form>
      
     
       <div className="text-center mt-6">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <Link
            to="/auth/signup"
            className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;