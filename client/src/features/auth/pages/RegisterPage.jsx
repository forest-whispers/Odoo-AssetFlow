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
import { registerSchema } from "../schemas/authSchemas"
import { authApi } from "../api/authApi"
import { setAuth } from "@/store/authSlice"

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      employeeId: "",
      jobTitle: "",
    },
  })

  const registerMutation = useMutation({
    mutationFn: async (data) => {
      // 1. Call register API
      await authApi.register(data)
      // 2. Fetch full profile from unified /users/me
      const profileRes = await authApi.getProfile()
      if (!profileRes?.success || !profileRes?.data) {
        throw new Error("Unable to load profile after registration")
      }
      return profileRes.data
    },
    onSuccess: (profile) => {
      dispatch(setAuth(profile))
      toast.success("Account created successfully!")
      navigate("/dashboard", { replace: true })
    },
    onError: (error) => {
      const errMsg = error.response?.data?.message || error.message || "Registration failed"
      toast.error(errMsg)
    },
  })

  const onSubmit = (data) => {
    registerMutation.mutate(data)
  }

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Register as an employee to get started with AssetFlow"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="name">Full Name</Label>
          <div className="mt-1">
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              {...register("name")}
              className={errors.name ? "border-destructive focus-visible:ring-destructive/20" : ""}
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="email">Email Address</Label>
          <div className="mt-1">
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
          <Label htmlFor="password">Password</Label>
          <div className="mt-1 relative">
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

        <div>
          <Label htmlFor="employeeId">Employee ID (Optional)</Label>
          <div className="mt-1">
            <Input
              id="employeeId"
              type="text"
              placeholder="EMP-123"
              {...register("employeeId")}
              className={errors.employeeId ? "border-destructive focus-visible:ring-destructive/20" : ""}
            />
          </div>
          {errors.employeeId && (
            <p className="mt-1 text-xs text-destructive">{errors.employeeId.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="jobTitle">Job Title (Optional)</Label>
          <div className="mt-1">
            <Input
              id="jobTitle"
              type="text"
              placeholder="Software Engineer"
              {...register("jobTitle")}
              className={errors.jobTitle ? "border-destructive focus-visible:ring-destructive/20" : ""}
            />
          </div>
          {errors.jobTitle && (
            <p className="mt-1 text-xs text-destructive">{errors.jobTitle.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full cursor-pointer h-9 mt-4 text-xs font-bold" disabled={registerMutation.isPending}>
          {registerMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Register"
          )}
        </Button>
      </form>

      <div className="mt-6 text-center text-xs text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-bold text-primary hover:underline">
          Sign in
        </Link>
      </div>
    </AuthLayout>
  )
}
