# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - alert [ref=e2]
  - generic [ref=e4]:
    - generic [ref=e5]:
      - heading "Welcome Back" [level=1] [ref=e6]
      - paragraph [ref=e7]: Sign in to your Aiverse account
    - button "Continue with Google" [ref=e9] [cursor=pointer]:
      - img [ref=e10]
      - text: Continue with Google
    - generic [ref=e19]: Or continue with email
    - generic [ref=e20]:
      - generic [ref=e21]:
        - generic [ref=e22]: Email Address
        - textbox "Email Address" [ref=e23]:
          - /placeholder: you@example.com
      - generic [ref=e24]:
        - generic [ref=e25]: Password
        - textbox "Password" [ref=e26]:
          - /placeholder: ••••••••
      - link "Forgot password?" [ref=e28] [cursor=pointer]:
        - /url: /auth/forgot-password
      - button "Sign In" [ref=e29] [cursor=pointer]
    - paragraph [ref=e31]:
      - text: Don't have an account?
      - link "Sign up" [ref=e32] [cursor=pointer]:
        - /url: /auth/signup
```