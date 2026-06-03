import { useState } from "react"
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
import { ArrowLeft } from "lucide-react"

export default function ForgotPassword({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess(false)

    try {
      // Call the forgot password API
      await authService.forgotPassword(email)
      setSuccess(true)
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send reset email. Please try again.")
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
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="absolute left-4 top-4 p-2 hover:bg-muted rounded-md"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex flex-col items-center text-center">
                <h1 className="text-sm font-semibold text-black! m-0 p-0 pt-1 leading-none" style={{ color: '#000000', fontSize: '35px', margin: 0, padding: 0, paddingTop: '30px', paddingBottom: '15px' }}>Forgot Password</h1>
                <p className="text-xs text-muted-foreground m-0 p-0 mb-3 leading-none" style={{ margin: 0, padding: 0, marginBottom: '35px' }}>
                  Enter your email to reset your password
                </p>
              </div>
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
                  Password reset email sent successfully! Please check your inbox.
                </div>
              )}
              {!success && (
                <>
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
                  <Field className="mt-2">
                    <Button type="submit" disabled={isLoading} className="w-full h-11">
                      {isLoading ? "Sending..." : "Send Reset Link"}
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
