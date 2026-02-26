import { useState, FormEvent } from "react";
import { useLogin, useNotify } from "react-admin";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Link,
} from "@mui/material";

export const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const login = useLogin();
  const notify = useNotify();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ username, password });
    } catch (error) {
      notify("Invalid username or password", { type: "error" });
    } finally {
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
            Login
          </Typography>

          <form onSubmit={handleSubmit}>
            <TextField
              label="Username"
              fullWidth
              margin="normal"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{ mt: 2 }}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <Box sx={{ mt: 2, textAlign: "center" }}>
            <Typography variant="body2">
              Don't have an account?{" "}
              <Link href="#/register" underline="hover">
                Register
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPage;
