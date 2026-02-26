import { Box, Card, CardContent, Paper, Typography } from "@mui/material";

interface PodiumCardProps {
  title: string;
  icon: React.ReactNode;
  data: any[];
  labelKey: string;
  subtitleKey?: string;
  valueKey?: string;
}

export const PodiumCard = ({
  title,
  icon,
  data,
  labelKey,
  subtitleKey,
  valueKey,
}: PodiumCardProps) => {
  const podiumColors = ["#FFD700", "#C0C0C0", "#CD7F32"];

  return (
    <Card elevation={2} sx={{ height: "100%" }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          {icon}
          <Typography variant="h6">{title}</Typography>
        </Box>
        {data.slice(0, 3).map((item, idx) => (
          <Paper
            key={idx}
            sx={{
              p: 1.5,
              mb: 1,
              display: "flex",
              alignItems: "center",
              gap: 2,
              bgcolor:
                idx === 0
                  ? "rgba(255, 215, 0, 0.1)"
                  : idx === 1
                    ? "rgba(192, 192, 192, 0.1)"
                    : "rgba(205, 127, 50, 0.1)",
            }}
          >
            <Typography
              variant="h5"
              sx={{
                color: podiumColors[idx],
                fontWeight: "bold",
                width: 30,
              }}
            >
              {idx + 1}
            </Typography>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body1" fontWeight="medium">
                {item[labelKey]}
              </Typography>
              {subtitleKey && (
                <Typography variant="body2" color="text.secondary">
                  {item[subtitleKey]}
                </Typography>
              )}
            </Box>
            {valueKey && (
              <Typography variant="body2" color="text.secondary">
                {item[valueKey]}
              </Typography>
            )}
          </Paper>
        ))}
        {data.length === 0 && (
          <Typography color="text.secondary">No data available</Typography>
        )}
      </CardContent>
    </Card>
  );
};
