import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useDispatch } from "react-redux"
import { useNavigate, Link } from "react-router-dom"
import { toast } from "sonner"
import { Eye, EyeOff, Loader2 } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import AuthLayout from "../components/AuthLayout"
import { loginSchema } from "../schemas/authSchemas"
import { authApi } from "../api/authApi"
import { setAuth } from "@/store/authSlice"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const loginMutation = useMutation({
    mutationFn: async (data) => {
      // 1. Authenticate credentials
      await authApi.login(data)
      // 2. Fetch full user profile
      const profileRes = await authApi.getProfile()
      if (!profileRes?.success || !profileRes?.data) {
        throw new Error("Unable to load profile after authentication")
      }
      return profileRes.data
    },
    onSuccess: (profile) => {
      dispatch(setAuth(profile))
      toast.success("Welcome back! Login successful.")
      navigate("/dashboard", { replace: true })
    },
    onError: (error) => {
      const errMsg = error.response?.data?.message || error.message || "Invalid credentials"
      toast.error(errMsg)
    },
  })

  const onSubmit = (data) => {
    loginMutation.mutate(data)
  }

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your AssetFlow account to manage enterprise resources"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <Label htmlFor="email">Email Address</Label>
          <div className="mt-1.5">
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              {...register("email")}
              className={errors.email ? "border-destructive focus-visible:ring-destructive/20" : ""}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
          </div>
          <div className="mt-1.5 relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              {...register("password")}
              className={`pr-10 ${errors.password ? "border-destructive focus-visible:ring-destructive/20" : ""}`}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full cursor-pointer h-9 text-xs font-bold" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>

      <div className="mt-6 text-center text-xs text-muted-foreground">
        New to AssetFlow?{" "}
        <Link to="/register" className="font-bold text-primary hover:underline">
          Request an account
        </Link>
      </div>
    </AuthLayout>
  )
}
