import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
  } from "recharts";
  
  export default function LatentChart({ data }: { data: any[] }) {
    const chartData = data.map((d) => ({
      name: `D${d.dimension}`,
      value: d.value
    }));
  
    return (
      <div style={{ width: "100%", height: 300, marginBottom: "30px" }}>
        <h3>Latent Dimensions</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }