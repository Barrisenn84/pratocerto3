import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { BodyMeasurement, UserProfile } from '../../types';

interface WeightChartProps {
  measurements: BodyMeasurement[];
  user: UserProfile | null;
}

export const WeightChart: React.FC<WeightChartProps> = ({ measurements, user }) => {
  if (!measurements || measurements.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
        Nenhuma medição registrada para exibir no gráfico.
      </div>
    );
  }

  const chartData = measurements.map((m) => {
    const parts = m.date.split('-');
    const label = `${parts[2]}/${parts[1]}`;
    return {
      date: m.date,
      formattedDate: label,
      weight: m.weight,
      waist: m.waist,
      arm: m.arm,
    };
  });

  const weights = measurements.map((m) => m.weight);
  const minWeight = Math.floor(Math.min(...weights, user?.targetWeight || 70) - 1);
  const maxWeight = Math.ceil(Math.max(...weights, user?.targetWeight || 85) + 1);

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis
            dataKey="formattedDate"
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickLine={false}
            axisLine={{ stroke: '#cbd5e1' }}
          />
          <YAxis
            domain={[minWeight, maxWeight]}
            tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'monospace' }}
            tickLine={false}
            axisLine={false}
            unit="kg"
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-slate-900 text-white p-2.5 rounded-xl text-xs shadow-xl border border-slate-800 font-mono">
                    <p className="font-sans font-semibold text-slate-300 mb-1">{data.date}</p>
                    <p className="font-bold text-emerald-400">Peso: {data.weight} kg</p>
                    {data.waist && <p className="text-slate-300">Cintura: {data.waist} cm</p>}
                    {data.arm && <p className="text-slate-300">Braço: {data.arm} cm</p>}
                  </div>
                );
              }
              return null;
            }}
          />

          {/* User Target Line */}
          {user?.targetWeight && (
            <ReferenceLine
              y={user.targetWeight}
              stroke="#059669"
              strokeDasharray="4 4"
              label={{
                value: `Meta: ${user.targetWeight}kg`,
                position: 'insideTopRight',
                fill: '#059669',
                fontSize: 11,
              }}
            />
          )}

          <Line
            type="monotone"
            dataKey="weight"
            stroke="#10b981"
            strokeWidth={3}
            dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#ffffff' }}
            activeDot={{ r: 6, fill: '#059669' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
