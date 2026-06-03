import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authService } from "@/lib/services"
import loginBg from "@/assets/login-bg.jpg"
import menroLogo from "@/assets/menro-logo.png"
import { Eye, EyeOff } from "lucide-react"

export default function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  // Check if user is already authenticated on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    const user = localStorage.getItem('user')
    
    // Only redirect if both token and user data exist
    if (token && user) {
      navigate('/dashboard', { replace: true })
    } else {
      // Clear invalid auth data
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
    }
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await authService.login(email, password)
      
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token)
      }
      
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user))
      }

      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      console.error('Login error:', err)
      if (err.code === 'ECONNABORTED') {
        setError('Connection timeout. Please check your internet connection and try again.')
      } else {
        setError(err.response?.data?.message || "Login failed. Please check your credentials.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="min-h-svh w-full flex items-center justify-center relative"
      style={{
        backgroundImage: `url(${loginBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div className={cn("relative w-full max-w-sm md:max-w-4xl p-6 md:p-10", className)} {...props}>
        <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-10 pt-8 md:p-12 md:pt-13 md:pb-16" onSubmit={handleSubmit}>
            <FieldGroup className="gap-0">
              <div className="flex flex-col items-center text-center -mt-1">
                <h1 className="text-sm font-semibold text-black! m-0 p-0 pt-1 leading-none" style={{ color: '#000000', fontSize: '35px', margin: 0, padding: 0, paddingTop: '30px', paddingBottom: '15px' }}>Welcome back</h1>
                <p className="text-xs text-muted-foreground m-0 p-0 mb-3 leading-none" style={{ margin: 0, padding: 0, marginBottom: '35px' }}>
                  Login to your Admin account
                </p>
              </div>
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}
              <Field className="gap-1.5 mb-7">
                <FieldLabel htmlFor="email" className="text-sm font-medium">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="h-10 bg-white"
                />
              </Field>
              <Field className="gap-1.5 mb-5">
                <FieldLabel htmlFor="password" className="text-sm font-medium">Password</FieldLabel>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="password"
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="h-10 pr-10 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-xs text-muted-foreground underline-offset-2 hover:underline text-right"
                >
                  Forgot password?
                </button>
              </Field>
              <Field className="mt-2">
                <Button type="submit" disabled={isLoading} className="w-full h-11 font-extrabold">
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
          <div className="relative hidden bg-muted md:flex items-center justify-center p-8">
            <img
              src={menroLogo}
              alt="Menro Logo"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
