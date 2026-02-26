import { useState, useRef } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
} from "@mui/material";
import { API_BASE_URL } from "./utils/common";

export const RegisterPage = () => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fullNameRef = useRef<HTMLInputElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    const fullName = fullNameRef.current?.value || "";
    const username = usernameRef.current?.value || "";
    const email = emailRef.current?.value || "";
    const password = passwordRef.current?.value || "";

    if (!fullName || !username || !email || !password) {
      setError("All fields are required");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
          full_name: fullName,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        // Handle validation errors (array) vs custom errors (string)
        let errorMessage = "Registration failed";
        if (typeof data.detail === "string") {
          errorMessage = data.detail;
        } else if (Array.isArray(data.detail)) {
          // Extract messages from validation errors
          errorMessage = data.detail
            .map((err: { msg?: string }) => err.msg || "Validation error")
            .join(", ");
        }
        throw new Error(errorMessage);
      }

      window.location.href = "#/login";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
      }}
    >
      <Card sx={{ minWidth: 350, maxWidth: 400 }}>
        <CardContent>
          <Typography
            variant="h5"
            component="h1"
            gutterBottom
            textAlign="center"
          >
            Register
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            label="Full Name"
            fullWidth
            margin="normal"
            inputRef={fullNameRef}
            required
          />
          <TextField
            label="Username"
            fullWidth
            margin="normal"
            inputRef={usernameRef}
            required
          />
          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            inputRef={emailRef}
            required
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            inputRef={passwordRef}
            required
          />
          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
            disabled={loading}
            onClick={handleSubmit}
          >
            {loading ? "Registering..." : "Register"}
          </Button>

          <Box sx={{ mt: 2, textAlign: "center" }}>
            <Typography variant="body2">
              Already have an account?{" "}
              <Link href="#/login" underline="hover">
                Login
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RegisterPage;
