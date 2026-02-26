import { ReactNode } from "react";

interface TabPanelProps {
  children?: ReactNode;
  index: number;
  value: number;
}

export const TabPanel = ({ children, value, index }: TabPanelProps) => (
  <div hidden={value !== index} style={{ padding: "16px 0" }}>
    {value === index && children}
  </div>
);
