import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, ArrowRight } from 'lucide-react';

export default function Signup() {
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [role, setRole] = useState<UserRole>('employee');
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const navigate = useNavigate();
	const { loginWithGoogle, refreshUser } = useAuth();

	const handleEmailSignup = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setIsLoading(true);

		try {
			const response = await fetch('/api/auth/signup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				credentials: 'include',
				body: JSON.stringify({ name, email, password, role }),
			});

			if (response.ok) {
				await refreshUser();
				navigate('/dashboard');
			} else {
				const data = await response.json();
				setError(data.message || 'Signup failed');
			}
		} catch (err) {
			setError('Signup failed. Please try again.');
			console.error(err);
		} finally {
			setIsLoading(false);
		}
	};

	const handleGoogleSignup = () => {
		try {
			loginWithGoogle();
		} catch (err) {
			setError('Signup failed. Please try again.');
			console.error(err);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50 dark:from-gray-900 dark:via-teal-900/20 dark:to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
			{/* Animated background elements */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div className="absolute top-20 left-10 w-72 h-72 bg-teal-400/20 rounded-full blur-3xl animate-pulse-subtle"></div>
				<div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl animate-pulse-subtle" style={{ animationDelay: '1s' }}></div>
				<div className="absolute top-1/2 left-1/3 w-64 h-64 bg-emerald-400/15 rounded-full blur-3xl animate-pulse-subtle" style={{ animationDelay: '2s' }}></div>
			</div>

			<div className="w-full max-w-md relative z-10">
				{/* Logo and Header */}
				<div className="mb-8 text-center animate-fade-in">
					<div className="flex items-center justify-center gap-3 mb-4">
						<div className="p-4 rounded-2xl bg-gradient-primary shadow-2xl hover-lift">
							<Leaf className="w-10 h-10 text-white" />
						</div>
						<h1 className="text-5xl font-bold text-gradient">Manager Ask</h1>
					</div>
					<p className="text-gray-600 dark:text-gray-400 text-lg font-medium">Create your account</p>
				</div>

				{/* Signup Card */}
				<Card className="border-0 shadow-2xl backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 animate-scale-in card-hover">
					<CardHeader className="space-y-2 pb-6 text-center">
						<CardTitle className="text-3xl font-bold text-gradient">Create Account</CardTitle>
						<CardDescription className="text-base text-gray-600 dark:text-gray-400">
							Fill in your details to get started
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{error && (
								<div className="p-4 bg-gradient-danger text-white rounded-xl text-sm font-medium shadow-lg animate-slide-in-up">
									{error}
								</div>
							)}

							{/* Email/Password Signup Form */}
							<form onSubmit={handleEmailSignup} className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="name">Full Name</Label>
									<Input
										id="name"
										type="text"
										placeholder="John Doe"
										value={name}
										onChange={(e) => setName(e.target.value)}
										required
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="email">Email</Label>
									<Input
										id="email"
										type="email"
										placeholder="your.email@company.com"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										required
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="password">Password</Label>
									<Input
										id="password"
										type="password"
										placeholder="Create a strong password"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										required
										minLength={6}
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="role">Account Type</Label>
									<Select value={role} onValueChange={(value: UserRole) => setRole(value)}>
										<SelectTrigger>
											<SelectValue placeholder="Select your role" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="employee">Employee</SelectItem>
											<SelectItem value="manager">Manager</SelectItem>
											<SelectItem value="admin">Admin</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<Button
									type="submit"
									className="w-full bg-gradient-primary hover:opacity-90 text-white font-semibold py-6 shadow-xl hover:shadow-2xl transition-all btn-glow ripple relative overflow-hidden group"
									disabled={isLoading}
								>
									<span className="relative z-10 flex items-center justify-center gap-2">
										{isLoading ? (
											<>
												<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
												Creating account...
											</>
										) : (
											<>
												Sign Up
												<ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
											</>
										)}
									</span>
								</Button>
							</form>

							{/* Divider */}
							<div className="relative">
								<div className="absolute inset-0 flex items-center">
									<span className="w-full border-t border-gray-300 dark:border-gray-600" />
								</div>
								<div className="relative flex justify-center text-sm uppercase">
									<span className="bg-white dark:bg-gray-800 px-4 text-gray-500 dark:text-gray-400 font-medium">Or continue with</span>
								</div>
							</div>

							{/* Google Sign Up */}
							<Button
								onClick={handleGoogleSignup}
								type="button"
								className="w-full bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-200 flex items-center justify-center gap-3 py-6 shadow-md hover:shadow-lg transition-all font-semibold"
							>
								<svg className="w-5 h-5" viewBox="0 0 24 24">
									<path
										fill="#4285F4"
										d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
									/>
									<path
										fill="#34A853"
										d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
									/>
									<path
										fill="#FBBC05"
										d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
									/>
									<path
										fill="#EA4335"
										d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
									/>
								</svg>
								Sign up with Google
							</Button>

							<p className="text-xs text-center text-gray-500">
								Note: Google signup creates an employee account by default
							</p>
						</div>
					</CardContent>
				</Card>

				{/* Link to Login */}
				<div className="mt-8 text-center animate-fade-in">
					<p className="text-base text-gray-700 dark:text-gray-300">
						Already have an account?{' '}
						<Link 
							to="/login" 
							className="font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 underline underline-offset-4 decoration-2 hover:decoration-teal-600 dark:hover:decoration-teal-400 transition-all duration-300"
						>
							Sign in here
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
