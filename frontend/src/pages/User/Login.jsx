import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, facebookProvider } from '../../firebase';

// Validation schema
const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required')
});

function Login() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, socialLogin } = useAuth();
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      email: '',
      password: ''
    },
    validationSchema: loginSchema,
    onSubmit: async (values) => {
      try {
        setError('');
        setLoading(true);

        const loggedInUser = await login(values.email, values.password);

        if (loggedInUser.isAdmin) {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } catch (err) {
        setError(err.message || 'Failed to log in');
      } finally {
        setLoading(false);
      }
    }
  });

  const handleSocialLogin = async (provider) => {
    setError('');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);

      const idToken = await result.user.getIdToken();

      const loggedInUser = await socialLogin(idToken);

      if (loggedInUser.isAdmin) {
        navigate('/admin');
      } else {
        navigate('/');
      }

    } catch (err) {
      const errorMessage = err.message || 'Social sign-in failed. Check console for details.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-900 text-white py-16 px-4 sm:px-8 shadow-2xl">
        <div className="max-w-6xl mx-auto text-center space-y-4">
          <p className="text-sm uppercase tracking-[0.4em] text-orange-400/80">RunMate Login</p>
          <h1 className="text-4xl sm:text-5xl font-black">
            Welcome back, <span className="text-orange-400">runner</span>.
          </h1>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            Stay synced with your gear, orders, and training streaks. Same bold energy as the home page—now tailored for your account.
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-10 lg:grid-cols-2">
          <section className="bg-white rounded-3xl border border-gray-100 shadow-2xl p-8">
            <p className="text-sm font-semibold text-orange-500 uppercase tracking-wide">Why log in?</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900">
              Sync your runs, rewards, and carts across every device.
            </h2>
            <ul className="mt-8 space-y-4">
              {[
                'Faster checkout backed by your saved preferences',
                'Track live order progress and returns',
                'Personalized drops based on your tempo and mileage',
                'Stay first in line for exclusive launches'
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-gray-700">
                  <span className="mt-1 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600 text-sm font-bold">
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-10 rounded-2xl bg-gray-900 text-white p-6 shadow-lg">
              <h3 className="font-semibold text-orange-400">New here?</h3>
              <p className="mt-1 text-sm text-gray-200">
                Create a RunMate account to start tracking your runs and rewards.
              </p>
              <Link
                to="/signup"
                className="inline-flex mt-4 items-center justify-center rounded-xl border border-orange-400 px-5 py-2 text-sm font-semibold text-orange-400 hover:bg-orange-500 hover:text-white transition"
              >
                Sign up instead
              </Link>
            </div>
          </section>

          <section className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 lg:p-10">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Login</h2>
              <span className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-sm font-semibold text-orange-600">
                Secure Portal
              </span>
            </div>
            {error && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={formik.handleSubmit} className="mt-8 space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-800">
                  Email Address
                </label>
                <div className="mt-2">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="runner@example.com"
                    className={`w-full rounded-2xl border px-4 py-3 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${formik.touched.email && formik.errors.email
                      ? 'border-red-300 focus:ring-red-400'
                      : 'border-gray-200'
                      }`}
                  />
                </div>
                {formik.touched.email && formik.errors.email && (
                  <p className="mt-2 text-sm text-red-600">{formik.errors.email}</p>
                )}
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-800">
                  Password
                </label>
                <div className="mt-2">
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="••••••••"
                    className={`w-full rounded-2xl border px-4 py-3 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${formik.touched.password && formik.errors.password
                      ? 'border-red-300 focus:ring-red-400'
                      : 'border-gray-200'
                      }`}
                  />
                </div>
                {formik.touched.password && formik.errors.password && (
                  <p className="mt-2 text-sm text-red-600">{formik.errors.password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-orange-200 transition hover:from-orange-600 hover:to-orange-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4">
                {/* Google Button */}
                <button
                  type="button"
                  onClick={() => handleSocialLogin(googleProvider)}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 rounded-2xl border border-gray-300 bg-white px-4 py-3 text-base font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-60"
                >
                  <img className="h-5 w-5" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" />
                  Sign in with Google
                </button>

                {/* Facebook Button */}
                <button
                  type="button"
                  onClick={() => handleSocialLogin(facebookProvider)}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 rounded-2xl border border-gray-300 bg-white px-4 py-3 text-base font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-60"
                >
                  <img className="h-5 w-5" src="https://www.svgrepo.com/show/475647/facebook-color.svg" alt="Facebook" />
                  Sign in with Facebook
                </button>
              </div>
            </div>

            <p className="mt-6 text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="font-semibold text-orange-600 hover:text-orange-700">
                Sign up
              </Link>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

export default Login;