import React, { useState } from 'react';
import { storageService } from '../services/storageService';
import { UserProfile } from '../types';
import { IconCheck } from './Icons';

interface AuthFormsProps {
  onLoginSuccess: (profile: UserProfile) => void;
  onGuestLogin?: () => void;
}

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
  "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo (Congo-Brazzaville)", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia",
  "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic",
  "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
  "Fiji", "Finland", "France",
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
  "Haiti", "Holy See", "Honduras", "Hungary",
  "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
  "Jamaica", "Japan", "Jordan",
  "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan",
  "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
  "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway",
  "Oman",
  "Pakistan", "Palau", "Palestine State", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar",
  "Romania", "Russia", "Rwanda",
  "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
  "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States of America", "Uruguay", "Uzbekistan",
  "Vanuatu", "Venezuela", "Vietnam",
  "Yemen",
  "Zambia", "Zimbabwe"
];

const AuthForms: React.FC<AuthFormsProps> = ({ onLoginSuccess, onGuestLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Register State
  const [regData, setRegData] = useState({
    name: '',
    email: '',
    age: '',
    gender: '',
    country: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreedToTerms: false
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsProcessing(true);
    
    try {
      const profile = await storageService.loginUser(loginEmail, loginPass);
      if (profile) {
        onLoginSuccess(profile);
      } else {
        setError("Invalid email or password.");
      }
    } catch (e) {
      setError("An error occurred during login.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (regData.password !== regData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!regData.gender) {
      setError("Please select a gender.");
      return;
    }
    if (!regData.country) {
      setError("Please select a country.");
      return;
    }
    if (!regData.agreedToTerms) {
      setError("You must agree to the Terms & Conditions.");
      return;
    }
    if (parseInt(regData.age) < 13) {
      setError("You must be at least 13 years old to use Tigra.");
      return;
    }

    setIsProcessing(true);
    try {
      const success = await storageService.registerUser({
        id: Date.now().toString(),
        name: regData.name,
        email: regData.email,
        age: regData.age,
        gender: regData.gender,
        country: regData.country,
        phone: regData.phone,
        joinedAt: Date.now()
      }, regData.password);

      if (success) {
        // Auto login after register
        const profile = await storageService.loginUser(regData.email, regData.password);
        if (profile) onLoginSuccess(profile);
      } else {
        setError("User with this email already exists.");
      }
    } catch (e) {
      setError("Registration failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isRegistering) {
    return (
      <div className="animate-fade-in w-full">
        <h3 className="text-2xl font-bold text-white mb-2">Create Account</h3>
        <p className="text-sm text-zinc-500 mb-6">Join TGO to save your history and personalize Tigra.</p>
        
        {error && <div className="p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">{error}</div>}
        
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
             <input type="text" placeholder="Full Name" required className="auth-input" 
                value={regData.name} onChange={e => setRegData({...regData, name: e.target.value})} />
             <input type="number" placeholder="Age" required className="auth-input" 
                value={regData.age} onChange={e => setRegData({...regData, age: e.target.value})} />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select required className="auth-input appearance-none"
               value={regData.gender} onChange={e => setRegData({...regData, gender: e.target.value})}
            >
               <option value="" disabled className="text-zinc-500">Select Gender</option>
               <option value="Male">Male</option>
               <option value="Female">Female</option>
               <option value="Non-binary">Non-binary</option>
               <option value="Other">Other</option>
            </select>
            
            <select required className="auth-input appearance-none"
               value={regData.country} onChange={e => setRegData({...regData, country: e.target.value})}
            >
               <option value="" disabled className="text-zinc-500">Select Country</option>
               {COUNTRIES.map(country => (
                 <option key={country} value={country}>{country}</option>
               ))}
            </select>
          </div>

          <input type="email" placeholder="Email Address" required className="auth-input" 
                value={regData.email} onChange={e => setRegData({...regData, email: e.target.value})} />
          <input type="tel" placeholder="Phone Number" required className="auth-input" 
                value={regData.phone} onChange={e => setRegData({...regData, phone: e.target.value})} />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
             <input type="password" placeholder="Password" required className="auth-input" 
                value={regData.password} onChange={e => setRegData({...regData, password: e.target.value})} />
             <input type="password" placeholder="Confirm Password" required className="auth-input" 
                value={regData.confirmPassword} onChange={e => setRegData({...regData, confirmPassword: e.target.value})} />
          </div>

          <div className="flex items-start gap-3 pt-2">
             <div className="relative flex items-center">
               <input 
                 type="checkbox" 
                 id="terms"
                 checked={regData.agreedToTerms} 
                 onChange={e => setRegData({...regData, agreedToTerms: e.target.checked})}
                 className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-zinc-600 bg-black checked:border-cyan-500 checked:bg-cyan-500 transition-all" 
               />
                <IconCheck className="pointer-events-none absolute left-0 top-0 h-4 w-4 text-black opacity-0 peer-checked:opacity-100" />
             </div>
             <label htmlFor="terms" className="text-xs text-zinc-400 leading-snug cursor-pointer select-none">
                I agree to the <span className="text-cyan-400 hover:underline">Terms & Conditions</span> and verify that my data will be stored securely in the IndexedDB system.
             </label>
          </div>

          <button 
            type="submit" 
            disabled={isProcessing}
            className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl font-bold text-white mt-4 shadow-lg shadow-cyan-900/20 active:scale-[0.98] transition-transform text-sm disabled:opacity-50 disabled:cursor-wait"
          >
            {isProcessing ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        
        <div className="mt-6 text-center pb-2">
           <button onClick={() => setIsRegistering(false)} className="text-sm text-zinc-500 hover:text-cyan-400 transition-colors py-2">
              Already have an account? <span className="text-zinc-300 underline underline-offset-4">Sign In</span>
           </button>
        </div>
        <style>{`
          .auth-input {
            width: 100%;
            background: #000;
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 0.75rem;
            padding: 0.875rem 1rem;
            font-size: 0.95rem;
            color: #fff;
            outline: none;
            transition: all 0.2s;
          }
          .auth-input:focus {
            border-color: rgba(34,211,238, 0.5);
            box-shadow: 0 0 0 1px rgba(34,211,238, 0.1);
          }
          select.auth-input {
             background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
             background-repeat: no-repeat;
             background-position: right 1rem center;
             background-size: 1em;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="animate-fade-in w-full">
       <div className="mb-6">
           <h3 className="text-2xl font-bold text-white mb-2">Welcome Back</h3>
           <p className="text-sm text-zinc-500">Sign in to access your chat history.</p>
       </div>
       
       {error && <div className="p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">{error}</div>}

       <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="email" 
            placeholder="Email Address" 
            required 
            className="w-full bg-black border border-white/10 rounded-xl px-4 py-3.5 text-base text-white focus:border-cyan-500/50 outline-none transition-colors"
            value={loginEmail}
            onChange={e => setLoginEmail(e.target.value)}
          />
          <input 
            type="password" 
            placeholder="Password" 
            required 
            className="w-full bg-black border border-white/10 rounded-xl px-4 py-3.5 text-base text-white focus:border-cyan-500/50 outline-none transition-colors"
            value={loginPass}
            onChange={e => setLoginPass(e.target.value)}
          />
          <button 
            type="submit" 
            disabled={isProcessing}
            className="w-full py-3.5 bg-white text-black rounded-xl font-bold mt-2 hover:bg-cyan-50 transition-colors shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-wait"
          >
            {isProcessing ? 'Signing In...' : 'Sign In'}
          </button>
       </form>

       <div className="mt-6 flex flex-col items-center gap-4">
           {onGuestLogin && (
             <button 
               onClick={onGuestLogin}
               className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors border-b border-zinc-800 hover:border-zinc-500 pb-0.5"
             >
               Continue as Guest
             </button>
           )}
           
           <div className="text-center">
             <p className="text-xs text-zinc-600 mb-3">Don't have an account?</p>
             <button onClick={() => setIsRegistering(true)} className="text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors border border-cyan-900/30 bg-cyan-950/20 px-6 py-2 rounded-full">
                Create Account
             </button>
           </div>
       </div>
    </div>
  );
};

export default AuthForms;