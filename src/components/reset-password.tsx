import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
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
import { Eye, EyeOff, ArrowLeft } from "lucide-react"

export default function ResetPassword({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const email = searchParams.get('email')
  
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess(false)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      setIsLoading(false)
      return
    }

    try {
      await authService.resetPassword({
        token: token || '',
        email: email || '',
        password,
        password_confirmation: confirmPassword
      })
      setSuccess(true)
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reset password. Please try again.")
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
          <form className="p-10 pt-8 md:p-12 md:pt-8 relative" onSubmit={handleSubmit}>
            <FieldGroup className="gap-0">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-sm font-semibold text-black! m-0 p-0 pt-1 leading-none" style={{ color: '#000000', fontSize: '35px', margin: 0, padding: 0, paddingTop: '30px', paddingBottom: '15px' }}>Reset Password</h1>
                <p className="text-xs text-muted-foreground m-0 p-0 mb-3 leading-none" style={{ margin: 0, padding: 0, marginBottom: '35px' }}>
                  Enter your new password
                </p>
              </div>
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
                  Password reset successfully! You can now login with your new password.
                </div>
              )}
              {!success && (
                <>
                  <Field className="gap-1.5 mb-5">
                    <FieldLabel htmlFor="password" className="text-sm font-medium">New Password</FieldLabel>
                    <div className="relative">
                      <Input 
                        id="password" 
                        type={showPassword ? "text" : "password"} 
                        placeholder="new password"
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
                  </Field>
                  <Field className="gap-1.5 mb-5">
                    <FieldLabel htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</FieldLabel>
                    <div className="relative">
                      <Input 
                        id="confirmPassword" 
                        type={showConfirmPassword ? "text" : "password"} 
                        placeholder="confirm password"
                        required 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isLoading}
                        className="h-10 pr-10 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={isLoading}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </Field>
                  <Field className="mt-2">
                    <Button type="submit" disabled={isLoading} className="w-full h-11">
                      {isLoading ? "Resetting..." : "Reset Password"}
                    </Button>
                  </Field>
                </>
              )}
              {success && (
                <Field className="mt-2">
                  <Button type="button" onClick={() => navigate('/login')} className="w-full h-11">
                    Back to Login
                  </Button>
                </Field>
              )}
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
