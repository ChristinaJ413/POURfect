import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

type DimensionDatum = {
  dimension: number;
  label: string;
  query_value: number;
  wine_value: number;
};

type Comparison = {
  result_index: number;
  title: string;
  similarity: number;
  dimensions: DimensionDatum[];
};

type Props = {
  comparisons: Comparison[];
};

export default function LatentComparisonCharts({ comparisons }: Props) {
  if (!comparisons || comparisons.length === 0) return null;

  return (
    <div style={{ marginTop: "2rem" }}>
      <h2>Why These Wines Were Chosen</h2>
      <p style={{ marginBottom: "1.5rem" }}>
        Each chart compares the query to one wine across the query’s strongest latent dimensions.
      </p>

      {comparisons.map((comp, idx) => {
        const chartData = comp.dimensions.map((d) => ({
          name: d.label || `D${d.dimension}`,
          query: d.query_value,
          wine: d.wine_value,
        }));

        return (
          <div
            key={idx}
            style={{
              marginBottom: "2rem",
              padding: "1rem",
              border: "1px solid #ddd",
              borderRadius: "12px",
            }}
          >
            <h3 style={{ marginBottom: "0.5rem" }}>
              {comp.title}
            </h3>
            <p style={{ marginBottom: "1rem" }}>
              Similarity Score: {comp.similarity.toFixed(3)}
            </p>

            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-20}
                    textAnchor="end"
                    interval={0}
                    height={80}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="query" name="Query" fill = "#8884d8" />
                  <Bar dataKey="wine" name="Wine" fill = "#82caa9d"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })}
    </div>
  );
}